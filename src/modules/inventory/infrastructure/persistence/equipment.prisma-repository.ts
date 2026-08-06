import { Injectable } from '@nestjs/common';
import { Equipment } from '../../domain/entities/equipment.entity';
import { EquipmentType } from '../../domain/enums/equipment-type.enum';
import { IEquipmentRepository } from '../../domain/repositories/equipment.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { PrismaService } from './prisma.service';
import { PrismaTransactionRunner } from './prisma-transaction-runner';

@Injectable()
export class EquipmentPrismaRepository implements IEquipmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
  ) { }

  async findById(id: string): Promise<Equipment | null> {
    const row = await this.prisma.equipment.findUnique({ where: { id } });
    if (!row) {
      return null;
    }

    return Equipment.restore({
      id: row.id,
      tenantId: row.tenantId,
      equipmentType: row.equipmentType as EquipmentType,
      minTemperature: row.minTemperature,
      maxTemperature: row.maxTemperature,
    });
  }

  async save(equipment: Equipment, scope?: ITransactionScope): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    await client.equipment.upsert({
      where: { id: equipment.id },
      create: {
        id: equipment.id,
        tenantId: equipment.tenantId,
        equipmentType: equipment.equipmentType,
        minTemperature: equipment.minTemperature,
        maxTemperature: equipment.maxTemperature,
      },
      update: {
        minTemperature: equipment.minTemperature,
        maxTemperature: equipment.maxTemperature,
      },
    });

    // Every reading that breaches range is also worth its own row for
    // historical/compliance analysis, in addition to the domain event
    // used to trigger reevaluation of stored components.
  }
}
