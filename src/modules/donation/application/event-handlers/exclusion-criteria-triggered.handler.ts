import { Inject, Injectable } from '@nestjs/common';
import { IDonorRepository } from '../../domain/repositories/donor.repository';
import { ExclusionCriteriaTriggeredEvent } from '../../domain/events/donation.events';
import { DonationTokens } from '../tokens';

/**
 * Reaction policy for ExclusionCriteriaTriggeredEvent.
 *
 * When a temporary or permanent exclusion criterion is triggered during
 * screening, the affected donor is marked inactive and, for a temporary
 * exclusion, given a concrete deferralEndDate (now + deferralInDays).
 *
 * This is what makes the "when can this donor donate again" question
 * answerable: the donor's deferral end date is now a queryable field
 * instead of living only inside an outbox event.
 *
 * In production this handler is intended to be invoked by the asynchronous
 * outbox consumer, not synchronously within the screening use case - keeping
 * the screening transaction focused on the Donation aggregate.
 */
@Injectable()
export class ExclusionCriteriaTriggeredHandler {
    constructor(
        @Inject(DonationTokens.DONOR_REPOSITORY) private readonly donorRepository: IDonorRepository,
    ) { }

    async handle(event: ExclusionCriteriaTriggeredEvent): Promise<void> {
        const donor = await this.donorRepository.findById(event.donorId);
        if (!donor) {
            return;
        }
        donor.markAsInactive(event.deferralInDays);
        await this.donorRepository.save(donor);
    }
}
