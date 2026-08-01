import { Module } from '@nestjs/common';
import { RegisterBloodBagUseCase } from '../application/use-cases/register-blood-bag/register-blood-bag.use-case';
import { SeparateComponentUseCase } from '../application/use-cases/separate-component/separate-component.use-case';
import { ReleaseFromQuarantineUseCase } from '../application/use-cases/release-from-quarantine/release-from-quarantine.use-case';
import { RejectFromQuarantineUseCase } from '../application/use-cases/reject-from-quarantine/reject-from-quarantine.use-case';
import { StoreComponentUseCase } from '../application/use-cases/store-component/store-component.use-case';
import { ReserveComponentUseCase } from '../application/use-cases/reserve-component/reserve-component.use-case';
import { ReleaseReservationUseCase } from '../application/use-cases/release-reservation/release-reservation.use-case';
import { AllocateComponentUseCase } from '../application/use-cases/allocate-component/allocate-component.use-case';
import { DiscardComponentUseCase } from '../application/use-cases/discard-component/discard-component.use-case';
import { RecordTemperatureReadingUseCase } from '../application/use-cases/record-temperature-reading/record-temperature-reading.use-case';
import { RegisterEquipmentUseCase } from '../application/use-cases/register-equipment/register-equipment.use-case';
import { TemperatureOutOfRangeHandler } from '../application/event-handlers/temperature-out-of-range.handler';
import {
  BLOOD_BAG_REPOSITORY,
  BLOOD_COMPONENT_REPOSITORY,
  EQUIPMENT_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
  TENANT_SETTINGS_REPOSITORY,
} from '../application/tokens';
import { PrismaService } from './persistence/prisma.service';
import { PrismaTransactionRunner } from './persistence/prisma-transaction-runner';
import { BloodBagPrismaRepository } from './persistence/blood-bag.prisma-repository';
import { BloodComponentPrismaRepository } from './persistence/blood-component.prisma-repository';
import { EquipmentPrismaRepository } from './persistence/equipment.prisma-repository';
import { OutboxEventPrismaWriter } from './persistence/outbox-event.prisma-writer';
import { TenantSettingsPrismaRepository } from './persistence/tenant-settings.prisma-repository';
import { InventoryController } from '../presentation/controllers/inventory.controller';

/**
 * NestJS wiring for the Inventory bounded context. This is the only file
 * in the module that is allowed to know both the domain interfaces
 * (tokens) and their concrete infrastructure implementations - use cases
 * never import a Prisma repository directly, only its port.
 */
@Module({
  controllers: [InventoryController],
  providers: [
    PrismaService,
    PrismaTransactionRunner,
    { provide: BLOOD_BAG_REPOSITORY, useClass: BloodBagPrismaRepository },
    { provide: BLOOD_COMPONENT_REPOSITORY, useClass: BloodComponentPrismaRepository },
    { provide: EQUIPMENT_REPOSITORY, useClass: EquipmentPrismaRepository },
    { provide: OUTBOX_EVENT_WRITER, useClass: OutboxEventPrismaWriter },
    { provide: TRANSACTION_RUNNER, useClass: PrismaTransactionRunner },
    { provide: TENANT_SETTINGS_REPOSITORY, useClass: TenantSettingsPrismaRepository },
    RegisterBloodBagUseCase,
    SeparateComponentUseCase,
    ReleaseFromQuarantineUseCase,
    RejectFromQuarantineUseCase,
    StoreComponentUseCase,
    ReserveComponentUseCase,
    ReleaseReservationUseCase,
    AllocateComponentUseCase,
    DiscardComponentUseCase,
    RecordTemperatureReadingUseCase,
    RegisterEquipmentUseCase,
    TemperatureOutOfRangeHandler,
  ],
})
export class InventoryModule { }
