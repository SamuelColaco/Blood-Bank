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

// ---- Read (query) port tokens ----
// Each maps a screen-facing query contract to its Prisma implementation,
// following the application/queries pattern described in SDD "Endpoints de
// API Faltando". Query ports are read-only: they never write to the outbox
// and never reconstruct an aggregate.
export const SEARCH_DONORS_QUERY = 'SEARCH_DONORS_QUERY';
export const GET_DONOR_DETAIL_QUERY = 'GET_DONOR_DETAIL_QUERY';
export const GET_DONOR_DONATIONS_QUERY = 'GET_DONOR_DONATIONS_QUERY';
export const GET_DAILY_AGENDA_QUERY = 'GET_DAILY_AGENDA_QUERY';
export const GET_SCREENING_QUEUE_QUERY = 'GET_SCREENING_QUEUE_QUERY';
export const GET_ACTIVE_QUESTIONNAIRE_QUERY = 'GET_ACTIVE_QUESTIONNAIRE_QUERY';
export const GET_DONATION_DETAIL_QUERY = 'GET_DONATION_DETAIL_QUERY';
export const GET_PENDING_DOUBLE_SIGNATURE_QUERY = 'GET_PENDING_DOUBLE_SIGNATURE_QUERY';
export const GET_APPROVED_DONATIONS_QUERY = 'GET_APPROVED_DONATIONS_QUERY';
export const GET_QUESTIONNAIRE_VERSIONS_QUERY = 'GET_QUESTIONNAIRE_VERSIONS_QUERY';

export const DonationTokens = {
    DONOR_REPOSITORY,
    DONATION_APPOINTMENT_REPOSITORY,
    CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY,
    DONATION_REPOSITORY,
    OUTBOX_EVENT_WRITER,
    TRANSACTION_RUNNER,
    SEARCH_DONORS_QUERY,
    GET_DONOR_DETAIL_QUERY,
    GET_DONOR_DONATIONS_QUERY,
    GET_DAILY_AGENDA_QUERY,
    GET_SCREENING_QUEUE_QUERY,
    GET_ACTIVE_QUESTIONNAIRE_QUERY,
    GET_DONATION_DETAIL_QUERY,
    GET_PENDING_DOUBLE_SIGNATURE_QUERY,
    GET_APPROVED_DONATIONS_QUERY,
    GET_QUESTIONNAIRE_VERSIONS_QUERY,
} as const;

export type DonationTokens = typeof DonationTokens;
