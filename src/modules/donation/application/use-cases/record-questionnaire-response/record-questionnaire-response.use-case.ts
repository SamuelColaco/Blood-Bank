import { Inject, Injectable } from '@nestjs/common';
import { Donation } from '../../../domain/entities/donation.entity';
import { QuestionnaireAnswer, QuestionnaireResponseSnapshot } from '../../../domain/entities/donation.entity';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface RecordQuestionnaireResponseInput {
    donationId: string;
    questionnaireVersionId: string;
    answers: QuestionnaireAnswer[];
}

export interface RecordQuestionnaireResponseOutput {
    success: boolean;
}

/**
 * UC-02: Record the clinical questionnaire response for a donation.
 *
 * Creates an immutable snapshot of the questionnaire at the time it was
 * answered, preserving the exact question text for medical-legal auditability.
 */
@Injectable()
export class RecordQuestionnaireResponseUseCase {
    constructor(
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: RecordQuestionnaireResponseInput): Promise<RecordQuestionnaireResponseOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new Error(`Donation ${input.donationId} not found.`);
        }

        const snapshot: QuestionnaireResponseSnapshot = {
            questionnaireVersionId: input.questionnaireVersionId,
            answeredAt: new Date(),
            answers: input.answers,
        };

        donation.recordQuestionnaireResponse(snapshot);

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents());
        });

        return { success: true };
    }
}
