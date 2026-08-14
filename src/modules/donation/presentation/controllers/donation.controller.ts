import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { RegisterDonorUseCase } from '../../application/use-cases/register-donor/register-donor.use-case';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/schedule-appointment/schedule-appointment.use-case';
import { RecordQuestionnaireResponseUseCase } from '../../application/use-cases/record-questionnaire-response/record-questionnaire-response.use-case';
import { RecordVitalSignsUseCase } from '../../application/use-cases/record-vital-signs/record-vital-signs.use-case';
import { ApproveDonationUseCase } from '../../application/use-cases/approve-donation/approve-donation.use-case';
import { RejectDonationUseCase } from '../../application/use-cases/reject-donation/reject-donation.use-case';
import { StartCollectionUseCase } from '../../application/use-cases/start-collection/start-collection.use-case';
import { CompleteCollectionUseCase } from '../../application/use-cases/complete-collection/complete-collection.use-case';
import { PublishQuestionnaireVersionUseCase } from '../../application/use-cases/publish-questionnaire-version/publish-questionnaire-version.use-case';
import { SyncOfflineDataUseCase } from '../../application/use-cases/sync-offline-data/sync-offline-data.use-case';
import type { SyncOfflineDataInput } from '../../application/use-cases/sync-offline-data/sync-offline-data.use-case';
import { SearchDonorsQuery } from '../../application/queries/search-donors/search-donors.query';
import { GetDonorDetailQuery } from '../../application/queries/get-donor-detail/get-donor-detail.query';
import { GetDonorDonationsQuery } from '../../application/queries/get-donor-donations/get-donor-donations.query';
import { GetDailyAgendaQuery } from '../../application/queries/get-daily-agenda/get-daily-agenda.query';
import { GetScreeningQueueQuery } from '../../application/queries/get-screening-queue/get-screening-queue.query';
import { GetActiveQuestionnaireQuery } from '../../application/queries/get-active-questionnaire/get-active-questionnaire.query';
import { GetDonationDetailQuery } from '../../application/queries/get-donation-detail/get-donation-detail.query';
import { GetPendingDoubleSignatureQuery } from '../../application/queries/get-pending-double-signature/get-pending-double-signature.query';
import { GetApprovedDonationsQuery } from '../../application/queries/get-approved-donations/get-approved-donations.query';
import { GetQuestionnaireVersionsQuery } from '../../application/queries/get-questionnaire-versions/get-questionnaire-versions.query';
import {
    registerDonorSchema,
    scheduleAppointmentSchema,
    recordQuestionnaireResponseSchema,
    recordVitalSignsSchema,
    approveDonationSchema,
    rejectDonationSchema,
    startCollectionSchema,
    completeCollectionSchema,
    publishQuestionnaireVersionSchema,
    syncOfflineDataSchema,
} from '../dtos/donation.dto';

/**
 * HTTP entry points for the Donation & Screening bounded context.
 * Deliberately thin: every request is validated against a zod schema and
 * handed straight to a use case (write) or a read query - no business logic
 * lives here. This controller was empty; it now exposes the full surface
 * described in SDD "Endpoints de API Faltando" §1.
 */
@Controller('donation')
export class DonationController {
    constructor(
        private readonly registerDonorUseCase: RegisterDonorUseCase,
        private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase,
        private readonly recordQuestionnaireResponseUseCase: RecordQuestionnaireResponseUseCase,
        private readonly recordVitalSignsUseCase: RecordVitalSignsUseCase,
        private readonly approveDonationUseCase: ApproveDonationUseCase,
        private readonly rejectDonationUseCase: RejectDonationUseCase,
        private readonly startCollectionUseCase: StartCollectionUseCase,
        private readonly completeCollectionUseCase: CompleteCollectionUseCase,
        private readonly publishQuestionnaireVersionUseCase: PublishQuestionnaireVersionUseCase,
        private readonly syncOfflineDataUseCase: SyncOfflineDataUseCase,
        private readonly searchDonorsQuery: SearchDonorsQuery,
        private readonly getDonorDetailQuery: GetDonorDetailQuery,
        private readonly getDonorDonationsQuery: GetDonorDonationsQuery,
        private readonly getDailyAgendaQuery: GetDailyAgendaQuery,
        private readonly getScreeningQueueQuery: GetScreeningQueueQuery,
        private readonly getActiveQuestionnaireQuery: GetActiveQuestionnaireQuery,
        private readonly getDonationDetailQuery: GetDonationDetailQuery,
        private readonly getPendingDoubleSignatureQuery: GetPendingDoubleSignatureQuery,
        private readonly getApprovedDonationsQuery: GetApprovedDonationsQuery,
        private readonly getQuestionnaireVersionsQuery: GetQuestionnaireVersionsQuery,
    ) { }

    // ---- Write ----

    @Post('donors')
    registerDonor(@Body() body: unknown) {
        return this.registerDonorUseCase.execute(registerDonorSchema.parse(body));
    }

    @Post('appointments')
    scheduleAppointment(@Body() body: unknown) {
        return this.scheduleAppointmentUseCase.execute(scheduleAppointmentSchema.parse(body));
    }

    @Post('donations/:id/questionnaire')
    recordQuestionnaireResponse(@Param('id') id: string, @Body() body: unknown) {
        const input = recordQuestionnaireResponseSchema.parse(body);
        return this.recordQuestionnaireResponseUseCase.execute({ donationId: id, ...input });
    }

    @Post('donations/:id/vital-signs')
    recordVitalSigns(@Param('id') id: string, @Body() body: unknown) {
        const input = recordVitalSignsSchema.parse(body);
        return this.recordVitalSignsUseCase.execute({ donationId: id, ...input });
    }

    @Put('donations/:id/approve')
    approveDonation(@Param('id') id: string, @Body() body: unknown) {
        const input = approveDonationSchema.parse(body);
        return this.approveDonationUseCase.execute({ donationId: id, ...input });
    }

    @Put('donations/:id/reject')
    rejectDonation(@Param('id') id: string, @Body() body: unknown) {
        const input = rejectDonationSchema.parse(body);
        return this.rejectDonationUseCase.execute({ donationId: id, ...input });
    }

    @Put('donations/:id/start-collection')
    startCollection(@Param('id') id: string, @Body() body: unknown) {
        const input = startCollectionSchema.parse(body);
        return this.startCollectionUseCase.execute({ donationId: id, ...input });
    }

    @Put('donations/:id/complete-collection')
    completeCollection(@Param('id') id: string, @Body() body: unknown) {
        const input = completeCollectionSchema.parse(body);
        return this.completeCollectionUseCase.execute({ donationId: id, ...input });
    }

    @Post('questionnaire-versions')
    publishQuestionnaireVersion(@Body() body: unknown) {
        return this.publishQuestionnaireVersionUseCase.execute(publishQuestionnaireVersionSchema.parse(body));
    }

    @Post('sync')
    syncOfflineData(@Body() body: unknown) {
        const input = syncOfflineDataSchema.parse(body);
        return this.syncOfflineDataUseCase.execute(input as unknown as SyncOfflineDataInput);
    }

    // ---- Read ----

    @Get('donors')
    searchDonors(@Query('tenantId') tenantId: string, @Query('query') query: string) {
        return this.searchDonorsQuery.execute({ tenantId, query: query ?? '' });
    }

    @Get('donors/:id/donations')
    getDonorDonations(@Param('id') id: string, @Query('tenantId') tenantId: string) {
        return this.getDonorDonationsQuery.execute({ tenantId, donorId: id });
    }

    @Get('donors/:id')
    getDonorDetail(@Param('id') id: string, @Query('tenantId') tenantId: string) {
        return this.getDonorDetailQuery.execute({ tenantId, donorId: id });
    }

    @Get('appointments')
    getDailyAgenda(
        @Query('tenantId') tenantId: string,
        @Query('date') date: string,
        @Query('unitId') _unitId?: string,
    ) {
        return this.getDailyAgendaQuery.execute({ tenantId, date: new Date(date) });
    }

    @Get('screening-queue')
    getScreeningQueue(@Query('tenantId') tenantId: string) {
        return this.getScreeningQueueQuery.execute({ tenantId });
    }

    @Get('questionnaire-versions/active')
    getActiveQuestionnaire(@Query('tenantId') tenantId: string) {
        return this.getActiveQuestionnaireQuery.execute({ tenantId });
    }

    @Get('questionnaire-versions')
    getQuestionnaireVersions(@Query('tenantId') tenantId: string) {
        return this.getQuestionnaireVersionsQuery.execute({ tenantId });
    }

    @Get('donations/pending-double-signature')
    getPendingDoubleSignature(@Query('tenantId') tenantId: string) {
        return this.getPendingDoubleSignatureQuery.execute({ tenantId });
    }

    @Get('donations/approved-for-collection')
    getApprovedDonations(@Query('tenantId') tenantId: string) {
        return this.getApprovedDonationsQuery.execute({ tenantId });
    }

    @Get('donations/:id')
    getDonationDetail(@Param('id') id: string, @Query('tenantId') tenantId: string) {
        return this.getDonationDetailQuery.execute({ tenantId, donationId: id });
    }
}
