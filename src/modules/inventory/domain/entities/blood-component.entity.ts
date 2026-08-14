import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { DonationPurpose } from '../../../../shared/domain/donation-purpose.enum';
import { ComponentStatus } from '../enums/component-status.enum';
import { ComponentType } from '../enums/component-type.enum';
import { DiscardReason } from '../enums/discard-reason.enum';
import { BloodType } from '../../../../shared/domain/blood-type.vo';
import { SpecialProcessing } from '../../../../shared/domain/special-processing.vo';
import { ValidityPeriod } from '../value-objects/validity-period.vo';
import { Reservation } from '../value-objects/reservation.vo';
import {
  ComponentAllocatedEvent,
  ComponentDiscardedEvent,
  ComponentExpiredEvent,
  ComponentIrradiatedEvent,
  ComponentLeukoreducedEvent,
  ComponentOfferedForExchangeEvent,
  ComponentReservedEvent,
  ComponentSeparatedEvent,
  ComponentStoredEvent,
  QuarantineReleasedEvent,
  QuarantineRejectedEvent,
  QuarantineStartedEvent,
  ReservationReleasedEvent,
} from '../events/blood-component.events';

/**
 * Aggregate root representing a single blood component derived from a
 * blood bag (red blood cells, platelets, plasma or cryoprecipitate).
 *
 * This is the real unit of operation in the Inventory bounded context:
 * quarantine release, reservation, allocation, expiration and discard all
 * happen per component, independently of any sibling component derived
 * from the same blood bag. That independence is exactly why this is its
 * own aggregate root instead of an entity nested inside BloodBag - see
 * docs/fase-1.md for the full reasoning.
 *
 * State machine (every transition below is guarded - there is no path
 * that skips a state):
 *
 *   SEPARATED -> IN_QUARANTINE -> CLEARED -> STORED -> RESERVED -> ALLOCATED
 *                              -> REJECTED                      -> (offer / expire / discard)
 *
 * Note: there is deliberately no "conditionally released" status. Any
 * exception to standard quarantine release is out of scope by product
 * decision - see docs/fase-1.md, "Escopo fechado".
 *
 * Physical processing (irradiation, leukoreduction) is applied while the
 * component is STORED, before it is reserved for a request - a request
 * only selects a component that already carries the required processing.
 * See SDD Fase 3, section 3.2.
 */
export class BloodComponent extends AggregateRoot<string> {
  private _status: ComponentStatus;
  private _isUnderReevaluation = false;
  private _reservation: Reservation | null = null;
  private _equipmentId: string | null = null;
  private _specialProcessing: SpecialProcessing;

  private constructor(
    id: string,
    public readonly tenantId: string,
    public readonly bloodBagId: string,
    public readonly componentType: ComponentType,
    public readonly bloodType: BloodType,
    public readonly validityPeriod: ValidityPeriod,
    public readonly donationPurpose: DonationPurpose,
    public readonly designatedRecipientId: string | null,
    status: ComponentStatus,
    specialProcessing: SpecialProcessing,
  ) {
    super(id);
    this._status = status;
    this._specialProcessing = specialProcessing;
  }

  /**
   * Creates a new component right after fractionation. It enters
   * quarantine immediately - there is no way to construct a component
   * that skips this step.
   */
  static separate(props: {
    id: string;
    tenantId: string;
    bloodBagId: string;
    componentType: ComponentType;
    bloodType: BloodType;
    validityPeriod: ValidityPeriod;
    donationPurpose: DonationPurpose;
    designatedRecipientId: string | null;
  }): BloodComponent {
    const component = new BloodComponent(
      props.id,
      props.tenantId,
      props.bloodBagId,
      props.componentType,
      props.bloodType,
      props.validityPeriod,
      props.donationPurpose,
      props.designatedRecipientId,
      ComponentStatus.IN_QUARANTINE,
      SpecialProcessing.none(),
    );
    component.addDomainEvent(
      new ComponentSeparatedEvent(component.id, component.bloodBagId, component.componentType),
    );
    component.addDomainEvent(new QuarantineStartedEvent(component.id));
    return component;
  }

  /**
   * Reconstructs a BloodComponent from persisted state (e.g. a database
   * row). Deliberately raises no domain events - events represent things
   * that just happened, not the act of loading existing data.
   */
  static restore(props: {
    id: string;
    tenantId: string;
    bloodBagId: string;
    componentType: ComponentType;
    bloodType: BloodType;
    validityPeriod: ValidityPeriod;
    donationPurpose: DonationPurpose;
    designatedRecipientId: string | null;
    status: ComponentStatus;
    isUnderReevaluation: boolean;
    reservation: Reservation | null;
    equipmentId: string | null;
    specialProcessing: SpecialProcessing;
  }): BloodComponent {
    const component = new BloodComponent(
      props.id,
      props.tenantId,
      props.bloodBagId,
      props.componentType,
      props.bloodType,
      props.validityPeriod,
      props.donationPurpose,
      props.designatedRecipientId,
      props.status,
      props.specialProcessing,
    );
    component._isUnderReevaluation = props.isUnderReevaluation;
    component._reservation = props.reservation;
    component._equipmentId = props.equipmentId;
    return component;
  }

  get status(): ComponentStatus {
    return this._status;
  }

  get isUnderReevaluation(): boolean {
    return this._isUnderReevaluation;
  }

  get reservation(): Reservation | null {
    return this._reservation;
  }

  get equipmentId(): string | null {
    return this._equipmentId;
  }

  get specialProcessing(): SpecialProcessing {
    return this._specialProcessing;
  }

  /**
   * Reacts to a negative serology result from the Donation & Screening
   * context. This is the ONLY way a component leaves quarantine as
   * CLEARED - there is no manual override.
   */
  releaseFromQuarantine(): void {
    this.assertStatus(ComponentStatus.IN_QUARANTINE, 'release from quarantine');
    this._status = ComponentStatus.CLEARED;
    this.addDomainEvent(new QuarantineReleasedEvent(this.id));
  }

  /** Reacts to a positive serology result. The component can never be used again. */
  rejectFromQuarantine(): void {
    this.assertStatus(ComponentStatus.IN_QUARANTINE, 'reject from quarantine');
    this._status = ComponentStatus.REJECTED;
    this.addDomainEvent(new QuarantineRejectedEvent(this.id));
  }

  /**
   * Moves a cleared component into active stock. Storing a component
   * always means storing it in a specific piece of equipment - the
   * cold-chain location is mandatory for traceability.
   */
  store(equipmentId: string): void {
    this.assertStatus(ComponentStatus.CLEARED, 'store');
    this._status = ComponentStatus.STORED;
    this._equipmentId = equipmentId;
    this.addDomainEvent(new ComponentStoredEvent(this.id, equipmentId));
  }

  /** Reserves the component for a hospital request. Refuses expired components even if their status is still STORED. */
  reserve(reservation: Reservation): void {
    this.assertStatus(ComponentStatus.STORED, 'reserve');
    if (this.validityPeriod.isExpiredAt(new Date())) {
      throw new DomainError(`Cannot reserve component ${this.id}: it has already expired.`);
    }
    if (this.donationPurpose !== DonationPurpose.GENERAL && reservation.requestedBy !== this.designatedRecipientId) {
      throw new DomainError(
        `Cannot reserve an ${this.donationPurpose.toLowerCase()} component for a different recipient.`,
      );
    }
    this._reservation = reservation;
    this._status = ComponentStatus.RESERVED;
    this.addDomainEvent(
      new ComponentReservedEvent(this.id, reservation.requestedBy, reservation.expiresAt),
    );
  }

  /** Releases an unused reservation (manually, or via the ReservaExpirada policy) back to available stock. */
  releaseReservation(): void {
    this.assertStatus(ComponentStatus.RESERVED, 'release reservation');
    this._reservation = null;
    this._status = ComponentStatus.STORED;
    this.addDomainEvent(new ReservationReleasedEvent(this.id));
  }

  /** Confirms the component was actually delivered/consumed by the requesting hospital. */
  allocate(crossmatchReference: string): void {
    this.assertStatus(ComponentStatus.RESERVED, 'allocate');
    if (!crossmatchReference || crossmatchReference.trim().length === 0) {
      throw new DomainError('Cannot allocate without a confirmed crossmatch reference.');
    }
    this._status = ComponentStatus.ALLOCATED;
    this.addDomainEvent(new ComponentAllocatedEvent(this.id, crossmatchReference));
  }

  /**
   * Applies physical irradiation to the component. Only callable while
   * STORED - a component can never be processed after it has been reserved
   * or allocated for a request. See SDD Fase 3, section 3.2.
   */
  applyIrradiation(): void {
    this.assertStatus(ComponentStatus.STORED, 'apply irradiation');
    if (this._specialProcessing.isIrradiated) {
      throw new DomainError(`Component ${this.id} has already been irradiated.`);
    }
    this._specialProcessing = this._specialProcessing.copyWithIrradiated();
    this.addDomainEvent(new ComponentIrradiatedEvent(this.id));
  }

  /**
   * Applies physical leukoreduction to the component. Only callable while
   * STORED - see applyIrradiation() for the same invariant.
   */
  applyLeukoreduction(): void {
    this.assertStatus(ComponentStatus.STORED, 'apply leukoreduction');
    if (this._specialProcessing.isLeukoreduced) {
      throw new DomainError(`Component ${this.id} has already been leukoreduced.`);
    }
    this._specialProcessing = this._specialProcessing.copyWithLeukoreduced();
    this.addDomainEvent(new ComponentLeukoreducedEvent(this.id));
  }

  /** Offers a surplus, close-to-expiry component to the Rede & Intercâmbio bounded context. */
  offerForExchange(): void {
    this.assertStatus(ComponentStatus.STORED, 'offer for exchange');
    if (this.donationPurpose !== DonationPurpose.GENERAL) {
      throw new DomainError(
        `${this.donationPurpose.toLowerCase()} components can never be offered for exchange.`,
      );
    }
    this._status = ComponentStatus.OFFERED_FOR_EXCHANGE;
    this.addDomainEvent(
      new ComponentOfferedForExchangeEvent(
        this.id,
        this.tenantId,
        this.componentType,
        this.bloodType.toString(),
      ),
    );
  }

  /**
   * Reacts asynchronously to a temperature breach reported by Equipment.
   * Deliberately does not change status by itself - a human still needs
   * to confirm the component is safe or discard it. See docs/fase-1.md,
   * section 2, for why this is eventually consistent rather than
   * transactional.
   */
  flagForReevaluation(): void {
    this._isUnderReevaluation = true;
  }

  clearReevaluationFlag(): void {
    this._isUnderReevaluation = false;
  }

  markExpired(): void {
    if (!this.validityPeriod.isExpiredAt(new Date())) {
      throw new DomainError(
        `Cannot mark component ${this.id} as expired before its validity period ends.`,
      );
    }
    this._status = ComponentStatus.EXPIRED;
    this.addDomainEvent(new ComponentExpiredEvent(this.id));
  }

  /**
   * Discarding always requires an explicit reason - enforced at the type
   * level as a required parameter, not an optional afterthought. This
   * feeds directly into the waste-reduction metrics from PRODUTO.md.
   */
  discard(reason: DiscardReason): void {
    if (this._status === ComponentStatus.DISCARDED) {
      throw new DomainError(`Component ${this.id} has already been discarded.`);
    }
    this._status = ComponentStatus.DISCARDED;
    this.addDomainEvent(new ComponentDiscardedEvent(this.id, reason));
  }

  private assertStatus(expected: ComponentStatus, action: string): void {
    if (this._status !== expected) {
      throw new DomainError(
        `Cannot ${action}: component ${this.id} is in status ${this._status}, expected ${expected}.`,
      );
    }
  }
}
