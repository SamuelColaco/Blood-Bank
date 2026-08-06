import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DonationAppointment } from '../../../domain/entities/donation-appointment.entity';
import { IDonationAppointmentRepository } from '../../../domain/repositories/donation-appointment.repository';
import { IDonorRepository } from '../../../domain/repositories/donor.repository';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface ScheduleAppointmentInput {
    tenantId: string;
    donorId: string;
    scheduledAt: Date;
}

export interface ScheduleAppointmentOutput {
    appointmentId: string;
}

/**
 * UC-01: Schedule a donation appointment for a donor.
 *
 * Validates that the donor exists and is not in an active deferral period
 * before creating the appointment.
 */
@Injectable()
export class ScheduleAppointmentUseCase {
    constructor(
        @Inject(DonationTokens.DONOR_REPOSITORY) private readonly donorRepository: IDonorRepository,
        @Inject(DonationTokens.DONATION_APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IDonationAppointmentRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: ScheduleAppointmentInput): Promise<ScheduleAppointmentOutput> {
        const donor = await this.donorRepository.findById(input.donorId);
        if (!donor) {
            throw new DomainError(`Donor ${input.donorId} not found.`);
        }

        const eligibility = donor.isEligibleToDonate();
        if (!eligibility.eligible) {
            throw new DomainError(
                `Cannot schedule appointment for donor ${input.donorId}: ${eligibility.reason}` +
                (eligibility.eligibleAt ? ` Eligible from ${eligibility.eligibleAt.toISOString()}.` : ''),
            );
        }

        const appointment = DonationAppointment.schedule({
            id: randomUUID(),
            tenantId: input.tenantId,
            donorId: input.donorId,
            scheduledAt: input.scheduledAt,
        });

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.appointmentRepository.save(appointment, scope);
            await this.outboxEventWriter.write(appointment.pullDomainEvents(), scope);
        });

        return { appointmentId: appointment.id };
    }
}
