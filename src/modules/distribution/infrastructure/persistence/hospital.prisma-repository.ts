import { Injectable } from '@nestjs/common';
import { Hospital } from '../../domain/entities/hospital.entity';
import { IHospitalRepository } from '../../domain/repositories/hospital.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { PrismaService } from '../../../../modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../../modules/inventory/infrastructure/persistence/prisma-transaction-runner';

@Injectable()
export class HospitalPrismaRepository implements IHospitalRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
  ) { }

  async findById(id: string): Promise<Hospital | null> {
    const row = await this.prisma.hospital.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    return Hospital.restore(row.id, row.tenantId, row.name);
  }

  async save(hospital: Hospital, scope?: ITransactionScope): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    await client.hospital.upsert({
      where: { id: hospital.id },
      create: {
        id: hospital.id,
        tenantId: hospital.tenantId,
        name: hospital.name,
      },
      update: { name: hospital.name },
    });
  }
}
