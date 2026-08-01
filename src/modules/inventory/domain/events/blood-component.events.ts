import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { DiscardReason } from '../enums/discard-reason.enum';
import { ComponentType } from '../enums/component-type.enum';

export class ComponentSeparatedEvent extends DomainEvent {
  readonly eventName = 'ComponentSeparated';
  constructor(
    public readonly aggregateId: string,
    public readonly bloodBagId: string,
    public readonly componentType: ComponentType,
  ) {
    super();
  }
}

export class QuarantineStartedEvent extends DomainEvent {
  readonly eventName = 'QuarantineStarted';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

/** Raised only in reaction to a serology result from Donation & Screening - never manually. */
export class QuarantineReleasedEvent extends DomainEvent {
  readonly eventName = 'QuarantineReleased';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

export class QuarantineRejectedEvent extends DomainEvent {
  readonly eventName = 'QuarantineRejected';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

export class ComponentStoredEvent extends DomainEvent {
  readonly eventName = 'ComponentStored';
  constructor(
    public readonly aggregateId: string,
    public readonly equipmentId: string,
  ) {
    super();
  }
}

export class ComponentReservedEvent extends DomainEvent {
  readonly eventName = 'ComponentReserved';
  constructor(
    public readonly aggregateId: string,
    public readonly requestedBy: string,
    public readonly reservationExpiresAt: Date,
  ) {
    super();
  }
}

export class ReservationReleasedEvent extends DomainEvent {
  readonly eventName = 'ReservationReleased';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

export class ComponentAllocatedEvent extends DomainEvent {
  readonly eventName = 'ComponentAllocated';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

/** Consumed by the (future) Rede & Intercâmbio bounded context - see ARQUITETURA.md. */
export class ComponentOfferedForExchangeEvent extends DomainEvent {
  readonly eventName = 'ComponentOfferedForExchange';
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly componentType: ComponentType,
    public readonly bloodType: string,
  ) {
    super();
  }
}

export class ComponentExpiredEvent extends DomainEvent {
  readonly eventName = 'ComponentExpired';
  constructor(public readonly aggregateId: string) {
    super();
  }
}

export class ComponentDiscardedEvent extends DomainEvent {
  readonly eventName = 'ComponentDiscarded';
  constructor(
    public readonly aggregateId: string,
    public readonly reason: DiscardReason,
  ) {
    super();
  }
}
