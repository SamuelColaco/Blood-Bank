import { Module } from '@nestjs/common';
import { DonationPrismaService } from './persistence/donation-prisma.service';
import { DonationPrismaTransactionRunner } from './persistence/transaction-runner';
import { DonationOutboxEventWriter } from './persistence/outbox-event.writer';
import { DonorPrismaRepository } from './persistence/donor.prisma-repository';
import { DonationAppointmentPrismaRepository } from './persistence/donation-appointment.prisma-repository';
import { ClinicalQuestionnaireVersionPrismaRepository } from './persistence/clinical-questionnaire-version.prisma-repository';
import { DonationPrismaRepository } from './persistence/donation.prisma-repository';
import { DonationTokens } from '../application/tokens';

/**
 * Infrastructure module for Donation & Screening bounded context.
 *
 * Wires Prisma, transaction runner, outbox writer and all repositories
 * so they can be injected into use cases. Presentation/controllers are
 * registered separately in the presentation layer.
 *
 * Follows the same pattern as InventoryModule: use cases inject via
 * string tokens (DonationTokens.*), and this module binds each token
 * to its concrete Prisma implementation.
 */
@Module({
    providers: [
        // Transaction / outbox pattern (same as Inventory)
        DonationPrismaService,
        DonationPrismaTransactionRunner,
        DonationOutboxEventWriter,
        DonorPrismaRepository,
        DonationAppointmentPrismaRepository,
        ClinicalQuestionnaireVersionPrismaRepository,
        DonationPrismaRepository,
        // Repositories bound to their DI tokens
        { provide: DonationTokens.DONOR_REPOSITORY, useClass: DonorPrismaRepository },
        { provide: DonationTokens.DONATION_APPOINTMENT_REPOSITORY, useClass: DonationAppointmentPrismaRepository },
        { provide: DonationTokens.CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY, useClass: ClinicalQuestionnaireVersionPrismaRepository },
        { provide: DonationTokens.DONATION_REPOSITORY, useClass: DonationPrismaRepository },
        { provide: DonationTokens.OUTBOX_EVENT_WRITER, useClass: DonationOutboxEventWriter },
        { provide: DonationTokens.TRANSACTION_RUNNER, useClass: DonationPrismaTransactionRunner },
    ],
    exports: [
        DonationPrismaService,
        DonationPrismaTransactionRunner,
        DonationOutboxEventWriter,
        DonorPrismaRepository,
        DonationAppointmentPrismaRepository,
        ClinicalQuestionnaireVersionPrismaRepository,
        DonationPrismaRepository,
        DonationTokens.DONOR_REPOSITORY,
        DonationTokens.DONATION_APPOINTMENT_REPOSITORY,
        DonationTokens.CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY,
        DonationTokens.DONATION_REPOSITORY,
        DonationTokens.OUTBOX_EVENT_WRITER,
        DonationTokens.TRANSACTION_RUNNER,
    ],
})
export class DonationInfrastructureModule { }