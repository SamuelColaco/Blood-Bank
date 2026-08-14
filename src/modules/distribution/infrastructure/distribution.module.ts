import { Module } from '@nestjs/common';
import { InventoryModule } from '../../../modules/inventory/infrastructure/inventory.module';
import { PrismaService } from '../../../modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../modules/inventory/infrastructure/persistence/prisma-transaction-runner';
import { OutboxEventPrismaWriter } from '../../../modules/inventory/infrastructure/persistence/outbox-event.prisma-writer';
import {
  HOSPITAL_REPOSITORY,
  HOSPITAL_REQUEST_REPOSITORY,
  TRANSPORT_CONTAINER_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../application/tokens';
import { HospitalPrismaRepository } from './persistence/hospital.prisma-repository';
import { HospitalRequestPrismaRepository } from './persistence/hospital-request.prisma-repository';
import { TransportContainerPrismaRepository } from './persistence/transport-container.prisma-repository';
import { RegisterHospitalUseCase } from '../application/use-cases/register-hospital/register-hospital.use-case';
import { RequestComponentUseCase } from '../application/use-cases/request-component/request-component.use-case';
import { MatchHospitalRequestUseCase } from '../application/use-cases/match-hospital-request/match-hospital-request.use-case';
import { ReserveHospitalRequestUseCase } from '../application/use-cases/reserve-hospital-request/reserve-hospital-request.use-case';
import { ProcessHospitalRequestUseCase } from '../application/use-cases/process-hospital-request/process-hospital-request.use-case';
import { ConfirmHospitalRequestPickUseCase } from '../application/use-cases/confirm-hospital-request-pick/confirm-hospital-request-pick.use-case';
import { OverrideComponentPickUseCase } from '../application/use-cases/override-component-pick/override-component-pick.use-case';
import { ConfirmCrossmatchUseCase } from '../application/use-cases/confirm-crossmatch/confirm-crossmatch.use-case';
import { AllocateHospitalRequestUseCase } from '../application/use-cases/allocate-hospital-request/allocate-hospital-request.use-case';
import { StartTransportUseCase } from '../application/use-cases/start-transport/start-transport.use-case';
import { RecordTransportTemperatureReadingUseCase } from '../application/use-cases/record-transport-temperature/record-transport-temperature.use-case';
import { ConfirmDeliveryUseCase } from '../application/use-cases/confirm-delivery/confirm-delivery.use-case';
import { CancelHospitalRequestUseCase } from '../application/use-cases/cancel-hospital-request/cancel-hospital-request.use-case';
import { TransportTemperatureOutOfRangeHandler } from '../application/event-handlers/transport-temperature-out-of-range.handler';
import { DistributionController } from '../presentation/controllers/distribution.controller';

/**
 * NestJS wiring for the Distribuição bounded context. It imports the
 * Inventory module so it can consume the cross-context contracts it
 * exposes (reservation/allocation use cases, the availability query, and
 * the shared Prisma transaction infrastructure) - Distribuição never
 * reimplements Inventory rules, only invokes them (SDD Fase 3, section 2).
 */
@Module({
  imports: [InventoryModule],
  controllers: [DistributionController],
  providers: [
    PrismaService,
    PrismaTransactionRunner,
    OutboxEventPrismaWriter,
    { provide: HOSPITAL_REPOSITORY, useClass: HospitalPrismaRepository },
    { provide: HOSPITAL_REQUEST_REPOSITORY, useClass: HospitalRequestPrismaRepository },
    { provide: TRANSPORT_CONTAINER_REPOSITORY, useClass: TransportContainerPrismaRepository },
    { provide: OUTBOX_EVENT_WRITER, useClass: OutboxEventPrismaWriter },
    { provide: TRANSACTION_RUNNER, useClass: PrismaTransactionRunner },
    RegisterHospitalUseCase,
    RequestComponentUseCase,
    MatchHospitalRequestUseCase,
    ReserveHospitalRequestUseCase,
    ProcessHospitalRequestUseCase,
    ConfirmHospitalRequestPickUseCase,
    OverrideComponentPickUseCase,
    ConfirmCrossmatchUseCase,
    AllocateHospitalRequestUseCase,
    StartTransportUseCase,
    RecordTransportTemperatureReadingUseCase,
    ConfirmDeliveryUseCase,
    CancelHospitalRequestUseCase,
    TransportTemperatureOutOfRangeHandler,
  ],
})
export class DistributionModule { }
