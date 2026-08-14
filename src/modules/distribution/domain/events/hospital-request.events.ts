import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { Urgency } from '../enums/urgency.enum';

export class HospitalRequestCreatedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestCreated';
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly hospitalId: string,
    public readonly requestedBloodType: string,
    public readonly urgency: Urgency,
  ) {
    super();
  }
}

export class HospitalRequestMatchedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestMatched';
  constructor(
    public readonly aggregateId: string,
    public readonly linkedComponentId: string,
    public readonly shortlist: string[],
  ) {
    super();
  }
}

export class HospitalRequestReservedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestReserved';
  constructor(
    public readonly aggregateId: string,
    public readonly linkedComponentId: string,
  ) {
    super();
  }
}

export class HospitalRequestPickConfirmedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestPickConfirmed';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

export class HospitalRequestPickOverriddenEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestPickOverridden';
  constructor(
    public readonly aggregateId: string,
    public readonly previousComponentId: string,
    public readonly chosenComponentId: string,
    public readonly reason: string | null,
  ) {
    super();
  }
}

export class HospitalRequestCrossmatchConfirmedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestCrossmatchConfirmed';
  constructor(
    public readonly aggregateId: string,
    public readonly crossmatchReference: string,
    public readonly confirmedBy: string,
  ) {
    super();
  }
}

export class HospitalRequestAllocatedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestAllocated';
  constructor(
    public readonly aggregateId: string,
    public readonly crossmatchReference: string,
  ) {
    super();
  }
}

export class HospitalRequestDeliveredEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestDelivered';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

export class HospitalRequestRejectedEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestRejected';
  constructor(
    public readonly aggregateId: string,
    public readonly reason: string,
  ) {
    super();
  }
}

export class HospitalRequestCancelledEvent extends DomainEvent {
  readonly eventName = 'HospitalRequestCancelled';
  constructor(
    public readonly aggregateId: string,
    public readonly reason: string,
  ) {
    super();
  }
}
