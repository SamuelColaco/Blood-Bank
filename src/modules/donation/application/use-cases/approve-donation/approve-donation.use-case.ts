import { Inject, Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
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
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: ApproveDonationInput): Promise<ApproveDonationOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new Error(`Donation ${input.donationId} not found.`);
        }

        if (donation.questionnaireSnapshot === null) {
            throw new Error(`Cannot approve donation ${input.donationId}: questionnaire not completed.`);
        }

        if (!donation.vitalSignsRecorded) {
            throw new Error(`Cannot approve donation ${input.donationId}: vital signs not recorded.`);
        }

        donation.approve();

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents(), scope);
        });

        return { success: true };
    }
}
