import { describe, expect, it } from 'vitest';
import { BloodComponentPrismaRepository } from '../../../src/modules/inventory/infrastructure/persistence/blood-component.prisma-repository';
import { OutboxEventPrismaWriter } from '../../../src/modules/inventory/infrastructure/persistence/outbox-event.prisma-writer';
import { PrismaService } from '../../../src/modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../src/modules/inventory/infrastructure/persistence/prisma-transaction-runner';
import { BloodComponent } from '../../../src/modules/inventory/domain/entities/blood-component.entity';
import { ComponentType } from '../../../src/modules/inventory/domain/enums/component-type.enum';
import { AboGroup, BloodType, RhFactor } from '../../../src/modules/inventory/domain/value-objects/blood-type.vo';
import { ValidityPeriod } from '../../../src/modules/inventory/domain/value-objects/validity-period.vo';
import { DomainEvent } from '../../../src/shared/domain/domain-event.base';
import { prisma } from '../setup';

describe('Outbox transactional atomicity (integration)', () => {
    const prismaService = new PrismaService();
    const transactionRunner = new PrismaTransactionRunner(prismaService);
    const componentRepository = new BloodComponentPrismaRepository(prismaService, transactionRunner);
    const outboxWriter = new OutboxEventPrismaWriter(prismaService, transactionRunner);

    it('rolls back both aggregate and outbox when either write fails inside the same transaction', async () => {
        const tenantId = 'tenant-rollback';
        const componentId = 'component-rollback';

        // Seed tenant so FK constraints are satisfied for the component itself.
        await prisma.tenant.create({
            data: { id: tenantId, name: 'Rollback Tenant', featureFlags: {} },
        });

        const component = BloodComponent.separate({
            id: componentId,
            tenantId,
            bloodBagId: 'bag-rollback',
            componentType: ComponentType.RED_BLOOD_CELLS,
            bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
            validityPeriod: ValidityPeriod.fromDays(new Date('2026-01-01'), 42),
        });

        // Force a real database failure inside the transaction by saving the
        // component with a bloodBagId that does not exist, violating the
        // FK constraint on blood_components.blood_bag_id.
        const componentWithInvalidFk = BloodComponent.separate({
            id: componentId,
            tenantId,
            bloodBagId: 'non-existent-bag',
            componentType: ComponentType.RED_BLOOD_CELLS,
            bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
            validityPeriod: ValidityPeriod.fromDays(new Date('2026-01-01'), 42),
        });
        componentWithInvalidFk.store('equipment-1');

        await expect(
            transactionRunner.runInTransaction(async (scope) => {
                await componentRepository.save(componentWithInvalidFk, scope);
                await outboxWriter.write(
                    [
                        new (class extends DomainEvent {
                            readonly eventName = 'ComponentStored';
                            readonly aggregateId = componentId;
                            readonly occurredAt = new Date();
                        })(),
                    ],
                    scope,
                );
            }),
        ).rejects.toThrow();

        const loaded = await componentRepository.findById(componentId);
        expect(loaded).toBeNull();
    });
});
