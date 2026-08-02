import { describe, expect, it } from 'vitest';
import { BloodComponentPrismaRepository } from '../../../src/modules/inventory/infrastructure/persistence/blood-component.prisma-repository';
import { PrismaService } from '../../../src/modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../src/modules/inventory/infrastructure/persistence/prisma-transaction-runner';
import { BloodComponent } from '../../../src/modules/inventory/domain/entities/blood-component.entity';
import { ComponentStatus } from '../../../src/modules/inventory/domain/enums/component-status.enum';
import { ComponentType } from '../../../src/modules/inventory/domain/enums/component-type.enum';
import { AboGroup, BloodType, RhFactor } from '../../../src/modules/inventory/domain/value-objects/blood-type.vo';
import { ValidityPeriod } from '../../../src/modules/inventory/domain/value-objects/validity-period.vo';
import { DonationPurpose } from '../../../src/shared/domain/donation-purpose.enum';
import { prisma } from '../setup';

describe('BloodComponentPrismaRepository (integration)', () => {
    const prismaService = new PrismaService();
    const transactionRunner = new PrismaTransactionRunner(prismaService);
    const repository = new BloodComponentPrismaRepository(prismaService, transactionRunner);

    it('persists and reloads a component with equipmentId', async () => {
        const component = BloodComponent.separate({
            id: 'component-1',
            tenantId: 'tenant-1',
            bloodBagId: 'bag-1',
            componentType: ComponentType.RED_BLOOD_CELLS,
            bloodType: BloodType.create(AboGroup.A, RhFactor.POSITIVE),
            validityPeriod: ValidityPeriod.fromDays(new Date('2026-01-01'), 42),
            donationPurpose: DonationPurpose.GENERAL,
            designatedRecipientId: null,
        });

        component.releaseFromQuarantine();
        component.store('equipment-1');

        await repository.save(component);

        const loaded = await repository.findById('component-1');
        expect(loaded).not.toBeNull();
        expect(loaded!.status).toBe(ComponentStatus.STORED);
        expect(loaded!.equipmentId).toBe('equipment-1');
    });

    it('findStoredInEquipment returns only components stored in the given equipment', async () => {
        const componentA = BloodComponent.separate({
            id: 'component-a',
            tenantId: 'tenant-1',
            bloodBagId: 'bag-a',
            componentType: ComponentType.PLASMA,
            bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
            validityPeriod: ValidityPeriod.fromDays(new Date('2026-01-01'), 365),
            donationPurpose: DonationPurpose.GENERAL,
            designatedRecipientId: null,
        });
        componentA.releaseFromQuarantine();
        componentA.store('equipment-1');

        const componentB = BloodComponent.separate({
            id: 'component-b',
            tenantId: 'tenant-1',
            bloodBagId: 'bag-b',
            componentType: ComponentType.PLATELETS,
            bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
            validityPeriod: ValidityPeriod.fromDays(new Date('2026-01-01'), 5),
            donationPurpose: DonationPurpose.GENERAL,
            designatedRecipientId: null,
        });
        componentB.releaseFromQuarantine();
        componentB.store('equipment-2');

        await repository.save(componentA);
        await repository.save(componentB);

        const storedInEquipment1 = await repository.findStoredInEquipment('equipment-1');
        expect(storedInEquipment1).toHaveLength(1);
        expect(storedInEquipment1[0].id).toBe('component-a');
    });
});
