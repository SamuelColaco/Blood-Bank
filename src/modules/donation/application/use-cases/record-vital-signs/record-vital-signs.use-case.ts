import { Inject, Injectable } from '@nestjs/common';
import { Donation } from '../../../domain/entities/donation.entity';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface RecordVitalSignsInput {
    donationId: string;
}

export interface RecordVitalSignsOutput {
    success: boolean;
}

/**
 * UC-03: Record vital signs for a donation.
 *
 * Validates that the questionnaire has been completed before allowing
 * vital signs to be recorded.
 */
@Injectable()
export class RecordVitalSignsUseCase {
    constructor(
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: RecordVitalSignsInput): Promise<RecordVitalSignsOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new Error(`Donation ${input.donationId} not found.`);
        }

        if (donation.questionnaireSnapshot === null) {
            throw new Error(`Cannot record vital signs for donation ${input.donationId}: questionnaire not completed.`);
        }

        donation.recordVitalSigns();

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents());
        });

        return { success: true };
    }
}
