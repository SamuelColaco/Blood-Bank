import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Equipment } from '../../../domain/entities/equipment.entity';
import { EquipmentType } from '../../../domain/enums/equipment-type.enum';
import { IEquipmentRepository } from '../../../domain/repositories/equipment.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../ports/transaction-runner.port';
import { EQUIPMENT_REPOSITORY, OUTBOX_EVENT_WRITER, TRANSACTION_RUNNER } from '../../tokens';

export interface RegisterEquipmentInput {
    tenantId: string;
    equipmentType: EquipmentType;
    minTemperature: number;
    maxTemperature: number;
}

export interface RegisterEquipmentOutput {
    equipmentId: string;
}

/**
 * Use case: registers a new piece of storage equipment (freezer,
 * refrigerator, platelet agitator). This is the entry point for
 * equipment creation - without it, there is no valid equipmentId to
 * pass to StoreComponentUseCase, making the cold-chain traceability
 * requirement impossible to satisfy.
 */
@Injectable()
export class RegisterEquipmentUseCase {
    constructor(
        @Inject(EQUIPMENT_REPOSITORY) private readonly equipmentRepository: IEquipmentRepository,
        @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: RegisterEquipmentInput): Promise<RegisterEquipmentOutput> {
        const equipment = Equipment.register({
            id: randomUUID(),
            tenantId: input.tenantId,
            equipmentType: input.equipmentType,
            minTemperature: input.minTemperature,
            maxTemperature: input.maxTemperature,
        });

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.equipmentRepository.save(equipment, scope);
            await this.outboxEventWriter.write(equipment.pullDomainEvents(), scope);
        });

        return { equipmentId: equipment.id };
    }
}
