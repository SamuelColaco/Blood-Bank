import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { BloodType } from '../../../../shared/domain/blood-type.vo';
import { SpecialProcessing } from '../../../../shared/domain/special-processing.vo';
import { AvailableComponentMatch } from '../../../../shared/domain/ports/available-components-query.port';
import { HospitalRequestStatus } from '../enums/hospital-request-status.enum';
import { Urgency } from '../enums/urgency.enum';
import { OverrideLogEntry } from '../value-objects/override-log-entry.vo';
import {
  HospitalRequestAllocatedEvent,
  HospitalRequestCancelledEvent,
  HospitalRequestCreatedEvent,
  HospitalRequestCrossmatchConfirmedEvent,
  HospitalRequestDeliveredEvent,
  HospitalRequestMatchedEvent,
  HospitalRequestPickConfirmedEvent,
  HospitalRequestPickOverriddenEvent,
  HospitalRequestRejectedEvent,
  HospitalRequestReservedEvent,
} from '../events/hospital-request.events';

/**
 * The central aggregate of the Distribuição bounded context (SDD Fase 3,
 * section 4.1). It orchestrates a hospital's request on top of the
 * Inventory context - it never reserves/allocates components itself; those
 * state changes stay in Inventory and are invoked through its use cases.
 *
 * State machine:
 *   REQUESTED -> MATCHED -> RESERVED -> CROSSMATCH_CONFIRMED -> ALLOCATED -> DELIVERED
 *                                                                    -> CANCELLED (before ALLOCATED)
 *                     -> REJECTED (no compatible component)
 */
export class HospitalRequest extends AggregateRoot<string> {
  private _status: HospitalRequestStatus;
  private _linkedComponentId: string | null = null;
  private _shortlist: AvailableComponentMatch[] = [];
  private _crossmatchReference: string | null = null;
  private _crossmatchConfirmedBy: string | null = null;
  private _crossmatchConfirmedRole: string | null = null;
  private _awaitingPickConfirmation = false;
  private _overrideLog: OverrideLogEntry[] = [];
  private _rejectionReason: string | null = null;
  private _cancellationReason: string | null = null;

  private constructor(
    id: string,
    public readonly tenantId: string,
    public readonly hospitalId: string,
    public readonly requestedBloodType: BloodType,
    public readonly requiredSpecialProcessing: SpecialProcessing | null,
    public readonly urgency: Urgency,
    status: HospitalRequestStatus,
  ) {
    super(id);
    this._status = status;
  }

  static request(props: {
    id: string;
    tenantId: string;
    hospitalId: string;
    requestedBloodType: BloodType;
    requiredSpecialProcessing?: SpecialProcessing;
    urgency: Urgency;
  }): HospitalRequest {
    const request = new HospitalRequest(
      props.id,
      props.tenantId,
      props.hospitalId,
      props.requestedBloodType,
      props.requiredSpecialProcessing ?? null,
      props.urgency,
      HospitalRequestStatus.REQUESTED,
    );
    request.addDomainEvent(
      new HospitalRequestCreatedEvent(
        request.id,
        request.tenantId,
        request.hospitalId,
        request.requestedBloodType.toString(),
        request.urgency,
      ),
    );
    return request;
  }

  /** Reconstructs from persisted state. Raises no domain events. */
  static restore(props: {
    id: string;
    tenantId: string;
    hospitalId: string;
    requestedBloodType: BloodType;
    requiredSpecialProcessing: SpecialProcessing | null;
    urgency: Urgency;
    status: HospitalRequestStatus;
    linkedComponentId: string | null;
    shortlist: AvailableComponentMatch[];
    crossmatchReference: string | null;
    crossmatchConfirmedBy: string | null;
    crossmatchConfirmedRole: string | null;
    awaitingPickConfirmation: boolean;
    overrideLog: OverrideLogEntry[];
    rejectionReason: string | null;
    cancellationReason: string | null;
  }): HospitalRequest {
    const request = new HospitalRequest(
      props.id,
      props.tenantId,
      props.hospitalId,
      props.requestedBloodType,
      props.requiredSpecialProcessing,
      props.urgency,
      props.status,
    );
    request._linkedComponentId = props.linkedComponentId;
    request._shortlist = props.shortlist;
    request._crossmatchReference = props.crossmatchReference;
    request._crossmatchConfirmedBy = props.crossmatchConfirmedBy;
    request._crossmatchConfirmedRole = props.crossmatchConfirmedRole;
    request._awaitingPickConfirmation = props.awaitingPickConfirmation;
    request._overrideLog = props.overrideLog;
    request._rejectionReason = props.rejectionReason;
    request._cancellationReason = props.cancellationReason;
    return request;
  }

  get status(): HospitalRequestStatus {
    return this._status;
  }

  get linkedComponentId(): string | null {
    return this._linkedComponentId;
  }

  get shortlist(): AvailableComponentMatch[] {
    return this._shortlist;
  }

  get crossmatchReference(): string | null {
    return this._crossmatchReference;
  }

  get crossmatchConfirmedBy(): string | null {
    return this._crossmatchConfirmedBy;
  }

  get crossmatchConfirmedRole(): string | null {
    return this._crossmatchConfirmedRole;
  }

  get awaitingPickConfirmation(): boolean {
    return this._awaitingPickConfirmation;
  }

  get overrideLog(): OverrideLogEntry[] {
    return this._overrideLog;
  }

  get rejectionReason(): string | null {
    return this._rejectionReason;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason;
  }

  /**
   * Binds the auto-picked component (nearest to expiry) and records the
   * shortlist of other compatible options. For ELECTIVE requests the pick
   * still awaits hospital confirmation/override; for EMERGENCY it
   * auto-proceeds (shortlist is transparency only).
   */
  match(linkedComponentId: string, shortlist: AvailableComponentMatch[]): void {
    this.assertStatus(HospitalRequestStatus.REQUESTED, 'match');
    this._linkedComponentId = linkedComponentId;
    this._shortlist = shortlist;
    this._status = HospitalRequestStatus.MATCHED;
    this._awaitingPickConfirmation = this.urgency === Urgency.ELECTIVE;
    this.addDomainEvent(
      new HospitalRequestMatchedEvent(
        this.id,
        linkedComponentId,
        this._shortlist.map((m) => m.componentId),
      ),
    );
  }

  /** Confirms the linked component was reserved in the Inventory context. */
  reserve(): void {
    this.assertStatus(HospitalRequestStatus.MATCHED, 'reserve');
    if (!this._linkedComponentId) {
      throw new DomainError(`Cannot reserve request ${this.id} without a matched component.`);
    }
    this._status = HospitalRequestStatus.RESERVED;
    this.addDomainEvent(new HospitalRequestReservedEvent(this.id, this._linkedComponentId));
  }

  /** ELECTIVE: hospital confirms the auto-picked component (no override). */
  confirmPick(): void {
    this.assertStatus(HospitalRequestStatus.RESERVED, 'confirm pick');
    if (!this._awaitingPickConfirmation) {
      throw new DomainError(
        `Request ${this.id} is not awaiting a pick confirmation (${this.urgency}).`,
      );
    }
    this._awaitingPickConfirmation = false;
    this.addDomainEvent(new HospitalRequestPickConfirmedEvent(this.id));
  }

  /**
   * ELECTIVE: hospital swaps the auto-pick for another component from the
   * shortlist. Only the swap and the audit record happen here - the actual
   * reservation release / re-reserve is orchestrated by the use case using
   * the Inventory use cases (SDD Fase 3, UC-02 decision).
   */
  overridePick(chosenComponentId: string, reason?: string): void {
    this.assertStatus(HospitalRequestStatus.RESERVED, 'override pick');
    if (!this._awaitingPickConfirmation) {
      throw new DomainError(
        `Request ${this.id} is not awaiting a pick confirmation (${this.urgency}).`,
      );
    }
    if (!this._linkedComponentId) {
      throw new DomainError(`Request ${this.id} has no linked component to override.`);
    }
    if (chosenComponentId === this._linkedComponentId) {
      throw new DomainError(`Request ${this.id} is already linked to ${chosenComponentId}.`);
    }
    const previous = this._linkedComponentId;
    this._linkedComponentId = chosenComponentId;
    this._awaitingPickConfirmation = false;
    this._overrideLog.push(OverrideLogEntry.record(previous, chosenComponentId, reason ?? null));
    this.addDomainEvent(
      new HospitalRequestPickOverriddenEvent(this.id, previous, chosenComponentId, reason ?? null),
    );
  }

  /**
   * Registers the physical crossmatch result. The (lightweight) role check
   * happens at the use-case boundary; the aggregate records WHO confirmed
   * for traceability. An ELECTIVE request must first have its pick
   * confirmed or overridden - otherwise the hospital is still deciding.
   */
  confirmCrossmatch(crossmatchReference: string, confirmedBy: string, confirmedRole: string): void {
    this.assertStatus(HospitalRequestStatus.RESERVED, 'confirm crossmatch');
    if (!crossmatchReference || crossmatchReference.trim().length === 0) {
      throw new DomainError('Cannot confirm crossmatch without a reference.');
    }
    if (this._awaitingPickConfirmation) {
      throw new DomainError(
        `Request ${this.id} must confirm or override its component pick before crossmatch.`,
      );
    }
    this._crossmatchReference = crossmatchReference;
    this._crossmatchConfirmedBy = confirmedBy;
    this._crossmatchConfirmedRole = confirmedRole;
    this._status = HospitalRequestStatus.CROSSMATCH_CONFIRMED;
    this.addDomainEvent(
      new HospitalRequestCrossmatchConfirmedEvent(this.id, crossmatchReference, confirmedBy),
    );
  }

  /** Only reachable after crossmatch - the barrier UC-05 depends on. */
  allocate(): void {
    this.assertStatus(HospitalRequestStatus.CROSSMATCH_CONFIRMED, 'allocate');
    if (!this._crossmatchReference) {
      throw new DomainError(`Request ${this.id} has no crossmatch reference to allocate.`);
    }
    this._status = HospitalRequestStatus.ALLOCATED;
    this.addDomainEvent(new HospitalRequestAllocatedEvent(this.id, this._crossmatchReference));
  }

  confirmDelivery(): void {
    this.assertStatus(HospitalRequestStatus.ALLOCATED, 'confirm delivery');
    this._status = HospitalRequestStatus.DELIVERED;
    this.addDomainEvent(new HospitalRequestDeliveredEvent(this.id));
  }

  /** No compatible component was available. */
  reject(reason: string): void {
    this.assertStatus(HospitalRequestStatus.REQUESTED, 'reject');
    this._rejectionReason = reason;
    this._status = HospitalRequestStatus.REJECTED;
    this.addDomainEvent(new HospitalRequestRejectedEvent(this.id, reason));
  }

  /** Hospital/center cancels at any point before allocation. */
  cancel(reason: string): void {
    if (
      this._status === HospitalRequestStatus.ALLOCATED ||
      this._status === HospitalRequestStatus.DELIVERED ||
      this._status === HospitalRequestStatus.REJECTED ||
      this._status === HospitalRequestStatus.CANCELLED
    ) {
      throw new DomainError(
        `Cannot cancel request ${this.id} after its status is ${this._status}.`,
      );
    }
    this._cancellationReason = reason;
    this._status = HospitalRequestStatus.CANCELLED;
    this.addDomainEvent(new HospitalRequestCancelledEvent(this.id, reason));
  }

  private assertStatus(expected: HospitalRequestStatus, action: string): void {
    if (this._status !== expected) {
      throw new DomainError(
        `Cannot ${action}: request ${this.id} is in status ${this._status}, expected ${expected}.`,
      );
    }
  }
}
