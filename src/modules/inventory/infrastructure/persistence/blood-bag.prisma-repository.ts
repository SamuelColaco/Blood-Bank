import { Injectable } from '@nestjs/common';
import { BloodBag, BloodBagStatus } from '../../domain/entities/blood-bag.entity';
import { IBloodBagRepository } from '../../domain/repositories/blood-bag.repository';
import { PrismaService } from './prisma.service';

/**
 * Prisma implementation of IBloodBagRepository. Responsible only for
 * translating between the BloodBag aggregate and its persisted row -
 * it must never contain business rules, those all live on the aggregate.
 */
@Injectable()
export class BloodBagPrismaRepository implements IBloodBagRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<BloodBag | null> {
    const row = await this.prisma.bloodBag.findUnique({
      where: { id },
      include: { components: { select: { id: true } } },
    });
    if (!row) {
      return null;
    }

    return BloodBag.restore({
      id: row.id,
      tenantId: row.tenantId,
      donationId: row.donationId,
      collectedAt: row.collectedAt,
      status: row.status as BloodBagStatus,
      componentIds: row.components.map((component: { id: string }) => component.id),
    });
  }

  async save(bloodBag: BloodBag): Promise<void> {
    await this.prisma.bloodBag.upsert({
      where: { id: bloodBag.id },
      create: {
        id: bloodBag.id,
        tenantId: bloodBag.tenantId,
        donationId: bloodBag.donationId,
        collectedAt: bloodBag.collectedAt,
        status: bloodBag.status,
      },
      update: {
        status: bloodBag.status,
      },
    });
  }
}
