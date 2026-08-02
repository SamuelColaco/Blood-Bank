import { DomainEvent } from '../domain-event.base';

/**
 * Integration event published by the Donation & Screening bounded context
 * when a donation is physically collected.
 *
 * This is a SHARED CONTRACT between bounded contexts - it lives in
 * shared/domain because it is the integration event that Inventory
 * consumes to create the BloodBag. It is NOT a domain event internal
 * to Donation; it is the public contract that crosses the context
 * boundary asynchronously via the outbox.
 */
export class DonationCollectedEvent extends DomainEvent {
    readonly eventName = 'DonationCollected';

    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly tenantId: string,
        public readonly donorId: string,
        public readonly collectedAt: Date,
        public readonly donationType: 'WHOLE_BLOOD' | 'APHERESIS',
        public readonly donationPurpose: 'GENERAL' | 'AUTOLOGOUS' | 'DIRECTED',
        public readonly designatedRecipientId: string | null,
        public readonly isbtRangeAllocatedTo: string,
        public readonly questionnaireVersionId: string,
    ) {
        super();
    }
}
