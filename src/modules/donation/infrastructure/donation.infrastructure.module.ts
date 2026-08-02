import { Module } from '@nestjs/common';
import { DonationPrismaService } from './persistence/donation-prisma.service';
import { DonationPrismaTransactionRunner } from './persistence/transaction-runner';
import { DonationOutboxEventWriter } from './persistence/outbox-event.writer';
import { DonorPrismaRepository } from './persistence/donor.prisma-repository';
import { DonationAppointmentPrismaRepository } from './persistence/donation-appointment.prisma-repository';
import { ClinicalQuestionnaireVersionPrismaRepository } from './persistence/clinical-questionnaire-version.prisma-repository';
import { DonationPrismaRepository } from './persistence/donation.prisma-repository';

/**
 * Infrastructure module for Donation & Screening bounded context.
 *
 * Wires Prisma, transaction runner, outbox writer and all repositories
 * so they can be injected into use cases. Presentation/controllers are
 * registered separately in the presentation layer.
 */
@Module({
    providers: [
        // Transaction / outbox pattern (same as Inventory)
        DonationPrismaService,
        DonationPrismaTransactionRunner,
        DonationOutboxEventWriter,
        // Repositories
        DonorPrismaRepository,
        DonationAppointmentPrismaRepository,
        ClinicalQuestionnaireVersionPrismaRepository,
        DonationPrismaRepository,
    ],
    exports: [
        DonationPrismaService,
        DonationPrismaTransactionRunner,
        DonationOutboxEventWriter,
        DonorPrismaRepository,
        DonationAppointmentPrismaRepository,
        ClinicalQuestionnaireVersionPrismaRepository,
        DonationPrismaRepository,
    ],
})
export class DonationInfrastructureModule { }
