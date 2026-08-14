import { Injectable } from '@nestjs/common';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { TransportContainer } from '../../domain/entities/transport-container.entity';
import { ITransportContainerRepository } from '../../domain/repositories/transport-container.repository';
import { PrismaService } from '../../../../modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../../modules/inventory/infrastructure/persistence/prisma-transaction-runner';

@Injectable()
export class TransportContainerPrismaRepository implements ITransportContainerRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
  ) { }

  async findById(id: string): Promise<TransportContainer | null> {
    const row = await this.prisma.transportContainer.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    return TransportContainer.restore({
      id: row.id,
      tenantId: row.tenantId,
      linkedHospitalRequestId: row.hospitalRequestId,
      minTemperature: row.minTemperature,
      maxTemperature: row.maxTemperature,
    });
  }

  async save(container: TransportContainer, scope?: ITransactionScope): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    await client.transportContainer.upsert({
      where: { id: container.id },
      create: {
        id: container.id,
        tenantId: container.tenantId,
        hospitalRequestId: container.linkedHospitalRequestId,
        minTemperature: container.minTemperature,
        maxTemperature: container.maxTemperature,
      },
      update: {
        minTemperature: container.minTemperature,
        maxTemperature: container.maxTemperature,
      },
    });
  }

  async saveTemperatureReading(
    containerId: string,
    value: number,
    scope?: ITransactionScope,
  ): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    await client.transportTemperatureReading.create({
      data: { containerId, value },
    });
  }
}
