import { Injectable } from '@nestjs/common';
import { BloodBag, BloodBagStatus } from '../../domain/entities/blood-bag.entity';
import { DonationPurpose } from '../../../../shared/domain/donation-purpose.enum';
import { IBloodBagRepository } from '../../domain/repositories/blood-bag.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { PrismaService } from './prisma.service';
import { PrismaTransactionRunner } from './prisma-transaction-runner';

/**
 * Prisma implementation of IBloodBagRepository. Responsible only for
 * translating between the BloodBag aggregate and its persisted row -
 * it must never contain business rules, those all live on the aggregate.
 */
@Injectable()
export class BloodBagPrismaRepository implements IBloodBagRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
  ) { }

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
      donationPurpose: row.donationPurpose as DonationPurpose,
      designatedRecipientId: row.designatedRecipientId,
      status: row.status as BloodBagStatus,
      componentIds: row.components.map((component: { id: string }) => component.id),
    });
  }

  async save(bloodBag: BloodBag, scope?: ITransactionScope): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    await client.bloodBag.upsert({
      where: { id: bloodBag.id },
      create: {
        id: bloodBag.id,
        tenantId: bloodBag.tenantId,
        donationId: bloodBag.donationId,
        collectedAt: bloodBag.collectedAt,
        donationPurpose: bloodBag.donationPurpose,
        designatedRecipientId: bloodBag.designatedRecipientId,
        status: bloodBag.status,
      },
      update: {
        donationPurpose: bloodBag.donationPurpose,
        designatedRecipientId: bloodBag.designatedRecipientId,
        status: bloodBag.status,
      },
    });
  }
}
