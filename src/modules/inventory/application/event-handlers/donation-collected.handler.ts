import { Inject, Injectable } from '@nestjs/common';
import { DonationCollectedEvent } from '../../../../shared/domain/events/donation-collected.event';
import { RegisterBloodBagUseCase } from '../use-cases/register-blood-bag/register-blood-bag.use-case';

/**
 * Reaction policy for DonationCollectedEvent.
 *
 * This is the async boundary between the Donation & Screening and
 * Inventory bounded contexts. When a donation is collected, the Donation
 * context publishes DonationCollected to its own outbox. This handler
 * (running in the Inventory context) reacts by creating the BloodBag.
 *
 */
@Injectable()
export class DonationCollectedHandler {
    constructor(
        private readonly registerBloodBagUseCase: RegisterBloodBagUseCase,
    ) { }

    async handle(event: DonationCollectedEvent): Promise<void> {
        await this.registerBloodBagUseCase.execute({
            tenantId: event.tenantId,
            donationId: event.donationId,
            collectedAt: event.collectedAt,
            donationPurpose: event.donationPurpose,
            designatedRecipientId: event.designatedRecipientId ?? undefined,
        });
    }
}
