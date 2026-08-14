import { Inject, Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface RejectDonationInput {
    donationId: string;
    reason: string;
}

export interface RejectDonationOutput {
    success: boolean;
}

/**
 * UC: Reject a donation (Decisão de Aptidão). Wraps the aggregate's
 * `reject(reason)` and publishes DonationRejected to the outbox.
 * This use case was a gap - the route existed in the front contract but
 * no use case was exposed. See SDD "Endpoints de API Faltando" §1.1.
 */
@Injectable()
export class RejectDonationUseCase {
    constructor(
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: RejectDonationInput): Promise<RejectDonationOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new DomainError(`Donation ${input.donationId} not found.`);
        }

        donation.reject(input.reason);

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents(), scope);
        });

        return { success: true };
    }
}
