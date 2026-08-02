import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Donor } from '../../../domain/entities/donor.entity';
import { IDonorRepository } from '../../../domain/repositories/donor.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface RegisterDonorInput {
    tenantId: string;
    fullName: string;
    documentId: string;
    birthDate: Date;
    gender: 'MALE' | 'FEMALE';
}

export interface RegisterDonorOutput {
    donorId: string;
}

/**
 * UC-01: Register a new donor in the system.
 *
 * This is the entry point for the donor lifecycle. Once registered,
 * the donor can schedule appointments and undergo screening.
 */
@Injectable()
export class RegisterDonorUseCase {
    constructor(
        @Inject(DonationTokens.DONOR_REPOSITORY) private readonly donorRepository: IDonorRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: RegisterDonorInput): Promise<RegisterDonorOutput> {
        const donor = Donor.register({
            id: randomUUID(),
            tenantId: input.tenantId,
            fullName: input.fullName,
            documentId: input.documentId,
            birthDate: input.birthDate,
            gender: input.gender,
        });

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donorRepository.save(donor, scope);
            await this.outboxEventWriter.write(donor.pullDomainEvents(), scope);
        });

        return { donorId: donor.id };
    }
}
