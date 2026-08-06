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
    providers: [
        RegisterDonorUseCase,
        ScheduleAppointmentUseCase,
        RecordQuestionnaireResponseUseCase,
        RecordVitalSignsUseCase,
        ApproveDonationUseCase,
        StartCollectionUseCase,
        CompleteCollectionUseCase,
        PublishQuestionnaireVersionUseCase,
        SyncOfflineDataUseCase,
        ExclusionCriteriaTriggeredHandler,
    ],
    exports: [
        RegisterDonorUseCase,
        ScheduleAppointmentUseCase,
        RecordQuestionnaireResponseUseCase,
        RecordVitalSignsUseCase,
        ApproveDonationUseCase,
        StartCollectionUseCase,
        CompleteCollectionUseCase,
        PublishQuestionnaireVersionUseCase,
        SyncOfflineDataUseCase,
    ],
})
export class DonationModule { }
