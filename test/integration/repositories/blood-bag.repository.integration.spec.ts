import { describe, expect, it } from 'vitest';
import { BloodBagPrismaRepository } from '../../../src/modules/inventory/infrastructure/persistence/blood-bag.prisma-repository';
import { PrismaService } from '../../../src/modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../src/modules/inventory/infrastructure/persistence/prisma-transaction-runner';
import { BloodBag } from '../../../src/modules/inventory/domain/entities/blood-bag.entity';
import { prisma } from '../setup';

describe('BloodBagPrismaRepository (integration)', () => {
  const prismaService = new PrismaService();
  const transactionRunner = new PrismaTransactionRunner(prismaService);
  const repository = new BloodBagPrismaRepository(prismaService, transactionRunner);

  it('persists and reloads a blood bag with its component ids', async () => {
    const bloodBag = BloodBag.register({
      id: 'bag-1',
      tenantId: 'tenant-1',
      donationId: 'donation-1',
      collectedAt: new Date('2026-01-01'),
    });

    bloodBag.registerDerivedComponent('component-1');
    bloodBag.markAsFinalized();

    await repository.save(bloodBag);

    const loaded = await repository.findById('bag-1');
    expect(loaded).not.toBeNull();
    expect(loaded!.status).toBe('FINALIZED');
    expect(loaded!.componentIds).toEqual(['component-1']);
  });
});