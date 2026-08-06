import { Inject, Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { IDonorRepository } from '../../../domain/repositories/donor.repository';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface ApproveDonationInput {
    donationId: string;
    donationType: 'WHOLE_BLOOD' | 'APHERESIS';
}

export interface ApproveDonationOutput {
    success: boolean;
}

/**
 * UC-04: Approve a donation after questionnaire and vital signs are complete.
 *
 * This use case represents the clinical decision that the donor is fit
 * to donate. In a real system, this would involve double signature
 * validation for sensitive questions (hotspot 3).
 */
@Injectable()
export class ApproveDonationUseCase {
    constructor(
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.DONOR_REPOSITORY) private readonly donorRepository: IDonorRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: ApproveDonationInput): Promise<ApproveDonationOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new DomainError(`Donation ${input.donationId} not found.`);
        }

        const donor = await this.donorRepository.findById(donation.donorId);
        if (!donor) {
            throw new DomainError(`Donor ${donation.donorId} not found.`);
        }

        // The aggregate enforces UC-03 (vital signs within range) and UC-04
        // (questionnaire + vital signs complete) internally, using the
        // donor's sex for the sex-dependent acceptable range check.
        donation.approve(donor.genderValue);

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents(), scope);
        });

        return { success: true };
    }
}
