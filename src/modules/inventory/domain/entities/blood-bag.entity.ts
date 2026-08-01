import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { BloodBagRegisteredEvent } from '../events/blood-bag.events';

export enum BloodBagStatus {
  PROCESSING = 'PROCESSING',
  FINALIZED = 'FINALIZED',
}

/**
 * Aggregate root representing the original blood bag collected from a
 * donation, before it is fractionated into individual components.
 *
 * This aggregate has a deliberately short transactional life: once every
 * derived component has been separated, it stops being an active
 * transactional aggregate and becomes a read-only provenance record used
 * for traceability (lookback). It must never be locked or updated by
 * operations performed on its derived BloodComponents - that independence
 * is the reason BloodComponent is its own aggregate root instead of an
 * entity nested inside this one. See docs/fase-1.md for the full reasoning.
 */
export class BloodBag extends AggregateRoot<string> {
  private _status: BloodBagStatus;
  private readonly _componentIds: string[] = [];

  private constructor(
    id: string,
    public readonly tenantId: string,
    public readonly donationId: string,
    public readonly collectedAt: Date,
    status: BloodBagStatus,
  ) {
    super(id);
    this._status = status;
  }

  static register(props: {
    id: string;
    tenantId: string;
    donationId: string;
    collectedAt: Date;
  }): BloodBag {
    const bloodBag = new BloodBag(
      props.id,
      props.tenantId,
      props.donationId,
      props.collectedAt,
      BloodBagStatus.PROCESSING,
    );
    bloodBag.addDomainEvent(
      new BloodBagRegisteredEvent(bloodBag.id, bloodBag.tenantId, bloodBag.donationId),
    );
    return bloodBag;
  }

  /**
   * Reconstructs a BloodBag from persisted state. Raises no domain
   * events - loading existing data is not a new fact about the world.
   */
  static restore(props: {
    id: string;
    tenantId: string;
    donationId: string;
    collectedAt: Date;
    status: BloodBagStatus;
    componentIds: string[];
  }): BloodBag {
    const bloodBag = new BloodBag(
      props.id,
      props.tenantId,
      props.donationId,
      props.collectedAt,
      props.status,
    );
    bloodBag._componentIds.push(...props.componentIds);
    return bloodBag;
  }

  get status(): BloodBagStatus {
    return this._status;
  }

  get componentIds(): ReadonlyArray<string> {
    return this._componentIds;
  }

  /** Records that a component was derived from this bag during fractionation. */
  registerDerivedComponent(componentId: string): void {
    if (this._status === BloodBagStatus.FINALIZED) {
      throw new DomainError('Cannot derive a new component from a finalized blood bag.');
    }
    this._componentIds.push(componentId);
  }

  /** Called once fractionation is complete and every component has been separated. */
  markAsFinalized(): void {
    if (this._status === BloodBagStatus.FINALIZED) {
      throw new DomainError(`Blood bag ${this.id} is already finalized.`);
    }
    if (this._componentIds.length === 0) {
      throw new DomainError('Cannot finalize a blood bag with no derived components.');
    }
    this._status = BloodBagStatus.FINALIZED;
  }
}
