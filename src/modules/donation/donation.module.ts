import { Module } from '@nestjs/common';
import { DonationInfrastructureModule } from './infrastructure/donation.infrastructure.module';
import { RegisterDonorUseCase } from './application/use-cases/register-donor/register-donor.use-case';
import { ScheduleAppointmentUseCase } from './application/use-cases/schedule-appointment/schedule-appointment.use-case';
import { RecordQuestionnaireResponseUseCase } from './application/use-cases/record-questionnaire-response/record-questionnaire-response.use-case';
import { RecordVitalSignsUseCase } from './application/use-cases/record-vital-signs/record-vital-signs.use-case';
import { ApproveDonationUseCase } from './application/use-cases/approve-donation/approve-donation.use-case';
import { StartCollectionUseCase } from './application/use-cases/start-collection/start-collection.use-case';
import { CompleteCollectionUseCase } from './application/use-cases/complete-collection/complete-collection.use-case';
import { PublishQuestionnaireVersionUseCase } from './application/use-cases/publish-questionnaire-version/publish-questionnaire-version.use-case';
import { SyncOfflineDataUseCase } from './application/use-cases/sync-offline-data/sync-offline-data.use-case';
import { ExclusionCriteriaTriggeredHandler } from './application/event-handlers/exclusion-criteria-triggered.handler';
import { DonationController } from './presentation/controllers/donation.controller';
import { RejectDonationUseCase } from './application/use-cases/reject-donation/reject-donation.use-case';
// Read queries
import { SearchDonorsQuery } from './application/queries/search-donors/search-donors.query';
import { SearchDonorsPrismaQuery } from './application/queries/search-donors/search-donors.prisma-query';
import { GetDonorDetailQuery } from './application/queries/get-donor-detail/get-donor-detail.query';
import { GetDonorDetailPrismaQuery } from './application/queries/get-donor-detail/get-donor-detail.prisma-query';
import { GetDonorDonationsQuery } from './application/queries/get-donor-donations/get-donor-donations.query';
import { GetDonorDonationsPrismaQuery } from './application/queries/get-donor-donations/get-donor-donations.prisma-query';
import { GetDailyAgendaQuery } from './application/queries/get-daily-agenda/get-daily-agenda.query';
import { GetDailyAgendaPrismaQuery } from './application/queries/get-daily-agenda/get-daily-agenda.prisma-query';
import { GetScreeningQueueQuery } from './application/queries/get-screening-queue/get-screening-queue.query';
import { GetScreeningQueuePrismaQuery } from './application/queries/get-screening-queue/get-screening-queue.prisma-query';
import { GetActiveQuestionnaireQuery } from './application/queries/get-active-questionnaire/get-active-questionnaire.query';
import { GetActiveQuestionnairePrismaQuery } from './application/queries/get-active-questionnaire/get-active-questionnaire.prisma-query';
import { GetDonationDetailQuery } from './application/queries/get-donation-detail/get-donation-detail.query';
import { GetDonationDetailPrismaQuery } from './application/queries/get-donation-detail/get-donation-detail.prisma-query';
import { GetPendingDoubleSignatureQuery } from './application/queries/get-pending-double-signature/get-pending-double-signature.query';
import { GetPendingDoubleSignaturePrismaQuery } from './application/queries/get-pending-double-signature/get-pending-double-signature.prisma-query';
import { GetApprovedDonationsQuery } from './application/queries/get-approved-donations/get-approved-donations.query';
import { GetApprovedDonationsPrismaQuery } from './application/queries/get-approved-donations/get-approved-donations.prisma-query';
import { GetQuestionnaireVersionsQuery } from './application/queries/get-questionnaire-versions/get-questionnaire-versions.query';
import { GetQuestionnaireVersionsPrismaQuery } from './application/queries/get-questionnaire-versions/get-questionnaire-versions.prisma-query';
import { DonationTokens } from './application/tokens';

/**
 * Donation & Screening bounded context module.
 *
 * Entry point for everything that happens before the blood bag exists
 * as an aggregate in Inventory: donor registration, appointment scheduling,
 * clinical screening, eligibility decision, and the physical collection act.
 * Terminates when DonationCollected is published and Inventory reacts
 * by creating the BloodBag.
 */
@Module({
    imports: [DonationInfrastructureModule],
    controllers: [DonationController],
    providers: [
        RegisterDonorUseCase,
        ScheduleAppointmentUseCase,
        RecordQuestionnaireResponseUseCase,
        RecordVitalSignsUseCase,
        ApproveDonationUseCase,
        RejectDonationUseCase,
        StartCollectionUseCase,
        CompleteCollectionUseCase,
        PublishQuestionnaireVersionUseCase,
        SyncOfflineDataUseCase,
        ExclusionCriteriaTriggeredHandler,
        // Read queries + their Prisma implementations
        SearchDonorsQuery,
        { provide: DonationTokens.SEARCH_DONORS_QUERY, useClass: SearchDonorsPrismaQuery },
        GetDonorDetailQuery,
        { provide: DonationTokens.GET_DONOR_DETAIL_QUERY, useClass: GetDonorDetailPrismaQuery },
        GetDonorDonationsQuery,
        { provide: DonationTokens.GET_DONOR_DONATIONS_QUERY, useClass: GetDonorDonationsPrismaQuery },
        GetDailyAgendaQuery,
        { provide: DonationTokens.GET_DAILY_AGENDA_QUERY, useClass: GetDailyAgendaPrismaQuery },
        GetScreeningQueueQuery,
        { provide: DonationTokens.GET_SCREENING_QUEUE_QUERY, useClass: GetScreeningQueuePrismaQuery },
        GetActiveQuestionnaireQuery,
        { provide: DonationTokens.GET_ACTIVE_QUESTIONNAIRE_QUERY, useClass: GetActiveQuestionnairePrismaQuery },
        GetDonationDetailQuery,
        { provide: DonationTokens.GET_DONATION_DETAIL_QUERY, useClass: GetDonationDetailPrismaQuery },
        GetPendingDoubleSignatureQuery,
        { provide: DonationTokens.GET_PENDING_DOUBLE_SIGNATURE_QUERY, useClass: GetPendingDoubleSignaturePrismaQuery },
        GetApprovedDonationsQuery,
        { provide: DonationTokens.GET_APPROVED_DONATIONS_QUERY, useClass: GetApprovedDonationsPrismaQuery },
        GetQuestionnaireVersionsQuery,
        { provide: DonationTokens.GET_QUESTIONNAIRE_VERSIONS_QUERY, useClass: GetQuestionnaireVersionsPrismaQuery },
    ],
    exports: [
        RegisterDonorUseCase,
        ScheduleAppointmentUseCase,
        RecordQuestionnaireResponseUseCase,
        RecordVitalSignsUseCase,
        ApproveDonationUseCase,
        RejectDonationUseCase,
        StartCollectionUseCase,
        CompleteCollectionUseCase,
        PublishQuestionnaireVersionUseCase,
        SyncOfflineDataUseCase,
    ],
})
export class DonationModule { }
