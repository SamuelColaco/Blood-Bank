import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/** Raised when a blood bag is first registered, right after collection. */
export class BloodBagRegisteredEvent extends DomainEvent {
  readonly eventName = 'BloodBagRegistered';

  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly donationId: string,
  ) {
    super();
  }
}
