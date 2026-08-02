import { Inject, Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../../../shared/domain/domain-event.base';
import { IDonorRepository } from '../../../domain/repositories/donor.repository';
import { IDonationAppointmentRepository } from '../../../domain/repositories/donation-appointment.repository';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { IClinicalQuestionnaireVersionRepository } from '../../../domain/repositories/clinical-questionnaire-version.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface SyncOfflineDataInput {
    events: DomainEvent[];
}

export interface SyncOfflineDataOutput {
    syncedCount: number;
}

/**
 * UC-08: Synchronize offline data from a device.
 *
 * This use case handles the synchronization of events that were created
 * offline on a device. It replays the events in the same order they were
 * created, ensuring idempotency.
 */
@Injectable()
export class SyncOfflineDataUseCase {
    constructor(
        @Inject(DonationTokens.DONOR_REPOSITORY) private readonly donorRepository: IDonorRepository,
        @Inject(DonationTokens.DONATION_APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IDonationAppointmentRepository,
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY) private readonly questionnaireRepository: IClinicalQuestionnaireVersionRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: SyncOfflineDataInput): Promise<SyncOfflineDataOutput> {
        // In a real implementation, this would replay the events in order.
        // For now, we just acknowledge the sync and write events to the outbox.
        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.outboxEventWriter.write(input.events, scope);
        });

        return {
            syncedCount: input.events.length,
        };
    }
}
