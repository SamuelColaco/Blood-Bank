import { Inject, Injectable } from '@nestjs/common';
import { Donation } from '../../../domain/entities/donation.entity';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface StartCollectionInput {
  donationId: string;
  donationType: 'WHOLE_BLOOD' | 'APHERESIS';
  machineId?: string; // Required if donationType is APHERESIS
}

export interface StartCollectionOutput {
  success: boolean;
}

/**
 * UC-05: Start the collection process for a donation.
 *
 * For apheresis donations, links the apheresis machine session.
 */
@Injectable()
export class StartCollectionUseCase {
  constructor(
    @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
    @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: StartCollectionInput): Promise<StartCollectionOutput> {
    const donation = await this.donationRepository.findById(input.donationId);
    if (!donation) {
      throw new DomainError(`Donation ${input.donationId} not found.`);
    }

    if (input.donationType === 'APHERESIS') {
      if (!input.machineId) {
        throw new DomainError(`Machine ID is required for apheresis donations.`);
      }
      donation.startApheresisSession(input.machineId);
    }

    donation.startCollection();

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.donationRepository.save(donation, scope);
      await this.outboxEventWriter.write(donation.pullDomainEvents(), scope);
    });

    return { success: true };
  }
}
