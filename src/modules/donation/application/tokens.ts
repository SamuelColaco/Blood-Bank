import { IClinicalQuestionnaireVersionRepository } from '../domain/repositories/clinical-questionnaire-version.repository';
import { IDonationAppointmentRepository } from '../domain/repositories/donation-appointment.repository';
import { IDonationRepository } from '../domain/repositories/donation.repository';
import { IDonorRepository } from '../domain/repositories/donor.repository';
import { IOutboxEventWriter } from '../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../shared/domain/transaction-runner.port';

/**
 * Dependency injection tokens for the Donation & Screening bounded context.
 *
 * These tokens decouple use cases from concrete infrastructure implementations,
 * following the ports-and-adapters pattern.
 */
export const DONOR_REPOSITORY = 'DONOR_REPOSITORY';
export const DONATION_APPOINTMENT_REPOSITORY = 'DONATION_APPOINTMENT_REPOSITORY';
export const CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY = 'CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY';
export const DONATION_REPOSITORY = 'DONATION_REPOSITORY';
export const OUTBOX_EVENT_WRITER = 'OUTBOX_EVENT_WRITER';
export const TRANSACTION_RUNNER = 'TRANSACTION_RUNNER';

export const DonationTokens = {
    DONOR_REPOSITORY,
    DONATION_APPOINTMENT_REPOSITORY,
    CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY,
    DONATION_REPOSITORY,
    OUTBOX_EVENT_WRITER,
    TRANSACTION_RUNNER,
} as const;

export type DonationTokens = typeof DonationTokens;
