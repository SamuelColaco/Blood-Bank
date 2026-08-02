import { Inject, Injectable } from '@nestjs/common';
import { Donation } from '../../../domain/entities/donation.entity';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface CompleteCollectionInput {
    donationId: string;
    collectedAt: Date;
    isbtRangeAllocatedTo: string;
    questionnaireVersionId: string;
}

export interface CompleteCollectionOutput {
    success: boolean;
}

/**
 * UC-06: Complete the collection process and publish DonationCollected.
 *
 * This is the final step in the donation lifecycle. It publishes the
 * DonationCollected event which will be consumed by the Inventory context
 * to create the BloodBag.
 */
@Injectable()
export class CompleteCollectionUseCase {
    constructor(
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: CompleteCollectionInput): Promise<CompleteCollectionOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new Error(`Donation ${input.donationId} not found.`);
        }

        donation.completeCollection(
            input.collectedAt,
            input.isbtRangeAllocatedTo,
            input.questionnaireVersionId,
        );

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents(), scope);
        });

        return { success: true };
    }
}
