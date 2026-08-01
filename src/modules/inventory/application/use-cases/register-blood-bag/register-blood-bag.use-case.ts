import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { BloodBag } from '../../../domain/entities/blood-bag.entity';
import { IBloodBagRepository } from '../../../domain/repositories/blood-bag.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../ports/transaction-runner.port';
import { BLOOD_BAG_REPOSITORY, OUTBOX_EVENT_WRITER, TRANSACTION_RUNNER } from '../../tokens';

export interface RegisterBloodBagInput {
  tenantId: string;
  donationId: string;
  collectedAt: Date;
}

export interface RegisterBloodBagOutput {
  bloodBagId: string;
}

/**
 * Use case: registers a new blood bag right after it arrives from
 * collection. This is the entry point of the Inventory bounded context -
 * in production it reacts to a "DonationCollected" integration event
 * published by the Donation & Screening context (not yet implemented,
 * see docs/roadmap.md); here it is represented simply as an explicit
 * input the caller provides.
 */
@Injectable()
export class RegisterBloodBagUseCase {
  constructor(
    @Inject(BLOOD_BAG_REPOSITORY) private readonly bloodBagRepository: IBloodBagRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: RegisterBloodBagInput): Promise<RegisterBloodBagOutput> {
    const bloodBag = BloodBag.register({
      id: randomUUID(),
      tenantId: input.tenantId,
      donationId: input.donationId,
      collectedAt: input.collectedAt,
    });

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.bloodBagRepository.save(bloodBag, scope);
      await this.outboxEventWriter.write(bloodBag.pullDomainEvents(), scope);
    });

    return { bloodBagId: bloodBag.id };
  }
}
