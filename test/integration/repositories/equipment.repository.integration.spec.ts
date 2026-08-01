import { describe, expect, it } from 'vitest';
import { EquipmentPrismaRepository } from '../../../src/modules/inventory/infrastructure/persistence/equipment.prisma-repository';
import { PrismaService } from '../../../src/modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../src/modules/inventory/infrastructure/persistence/prisma-transaction-runner';
import { Equipment } from '../../../src/modules/inventory/domain/entities/equipment.entity';
import { EquipmentType } from '../../../src/modules/inventory/domain/enums/equipment-type.enum';

describe('EquipmentPrismaRepository (integration)', () => {
  const prismaService = new PrismaService();
  const transactionRunner = new PrismaTransactionRunner(prismaService);
  const repository = new EquipmentPrismaRepository(prismaService, transactionRunner);

  it('persists and reloads an equipment', async () => {
    const equipment = Equipment.register({
      id: 'equipment-1',
      tenantId: 'tenant-1',
      equipmentType: EquipmentType.FREEZER,
      minTemperature: -40,
      maxTemperature: -18,
    });

    await repository.save(equipment);

    const loaded = await repository.findById('equipment-1');
    expect(loaded).not.toBeNull();
    expect(loaded!.equipmentType).toBe(EquipmentType.FREEZER);
    expect(loaded!.minTemperature).toBe(-40);
    expect(loaded!.maxTemperature).toBe(-18);
  });
});