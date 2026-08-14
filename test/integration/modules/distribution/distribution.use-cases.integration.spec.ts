import { describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../src/modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../../src/modules/inventory/infrastructure/persistence/prisma-transaction-runner';
import { OutboxEventPrismaWriter } from '../../../../src/modules/inventory/infrastructure/persistence/outbox-event.prisma-writer';
import { HospitalRequestPrismaRepository } from '../../../../src/modules/distribution/infrastructure/persistence/hospital-request.prisma-repository';
import { TransportContainerPrismaRepository } from '../../../../src/modules/distribution/infrastructure/persistence/transport-container.prisma-repository';
import { StartTransportUseCase } from '../../../../src/modules/distribution/application/use-cases/start-transport/start-transport.use-case';
import { RecordTransportTemperatureReadingUseCase } from '../../../../src/modules/distribution/application/use-cases/record-transport-temperature/record-transport-temperature.use-case';
import { ConfirmDeliveryUseCase } from '../../../../src/modules/distribution/application/use-cases/confirm-delivery/confirm-delivery.use-case';
import { HospitalRequestStatus } from '../../../../src/modules/distribution/domain/enums/hospital-request-status.enum';
import { prisma } from '../../setup';

describe('Distribution use cases (integration)', () => {
  const prismaService = new PrismaService();
  const transactionRunner = new PrismaTransactionRunner(prismaService);
  const outboxEventWriter = new OutboxEventPrismaWriter(prismaService, transactionRunner);
  const hospitalRequestRepository = new HospitalRequestPrismaRepository(prismaService, transactionRunner);
  const transportContainerRepository = new TransportContainerPrismaRepository(prismaService, transactionRunner);
  const startTransportUseCase = new StartTransportUseCase(hospitalRequestRepository, transportContainerRepository, outboxEventWriter, transactionRunner);
  const recordReading = new RecordTransportTemperatureReadingUseCase(transportContainerRepository, outboxEventWriter, transactionRunner);
  const confirmDelivery = new ConfirmDeliveryUseCase(hospitalRequestRepository, outboxEventWriter, transactionRunner);

  async function seedAllocatedRequest() {
    const tenant = await prisma.tenant.create({ data: { name: 'Test Tenant' } });
    const hospital = await prisma.hospital.create({ data: { tenantId: tenant.id, name: 'Test Hospital' } });
    const request = await prisma.hospitalRequest.create({
      data: {
        tenantId: tenant.id,
        hospitalId: hospital.id,
        requestedAboGroup: 'O',
        requestedRhFactor: 'NEGATIVE',
        urgency: 'ELECTIVE',
        status: HospitalRequestStatus.ALLOCATED,
      },
    });
    return request;
  }

  it('starts transport for an ALLOCATED request', async () => {
    const request = await seedAllocatedRequest();
    const result = await startTransportUseCase.execute({ requestId: request.id, minTemperature: 1, maxTemperature: 6 });
    expect(result.containerId).toBeDefined();
    const container = await transportContainerRepository.findById(result.containerId);
    expect(container).not.toBeNull();
    expect(container!.linkedHospitalRequestId).toBe(request.id);
  });

  it('refuses to start transport for a non-ALLOCATED request', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Test Tenant' } });
    const hospital = await prisma.hospital.create({ data: { tenantId: tenant.id, name: 'H' } });
    const request = await prisma.hospitalRequest.create({
      data: { tenantId: tenant.id, hospitalId: hospital.id, requestedAboGroup: 'O', requestedRhFactor: 'NEGATIVE', urgency: 'ELECTIVE', status: HospitalRequestStatus.MATCHED },
    });
    await expect(startTransportUseCase.execute({ requestId: request.id, minTemperature: 1, maxTemperature: 6 })).rejects.toThrow();
  });

  it('records a temperature reading and persists traceability row', async () => {
    const request = await seedAllocatedRequest();
    const { containerId } = await startTransportUseCase.execute({ requestId: request.id, minTemperature: 1, maxTemperature: 6 });
    await recordReading.execute({ containerId, value: 4 });
    const readings = await prisma.transportTemperatureReading.findMany({ where: { containerId } });
    expect(readings).toHaveLength(1);
    expect(readings[0].value).toBe(4);
  });

  it('raises an out-of-range event for a breach', async () => {
    const request = await seedAllocatedRequest();
    const { containerId } = await startTransportUseCase.execute({ requestId: request.id, minTemperature: 1, maxTemperature: 6 });
    await recordReading.execute({ containerId, value: -5 });
    const events = await prisma.outboxEvent.findMany({ where: { aggregateId: containerId } });
    expect(events.some((e) => e.eventName === 'TransportTemperatureOutOfRangeDetected')).toBe(true);
  });

  it('confirms delivery -> DELIVERED', async () => {
    const request = await seedAllocatedRequest();
    const result = await confirmDelivery.execute({ requestId: request.id });
    expect(result.status).toBe(HospitalRequestStatus.DELIVERED);
  });

  it('refuses to confirm delivery before allocation', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Test Tenant' } });
    const hospital = await prisma.hospital.create({ data: { tenantId: tenant.id, name: 'H' } });
    const request = await prisma.hospitalRequest.create({
      data: { tenantId: tenant.id, hospitalId: hospital.id, requestedAboGroup: 'O', requestedRhFactor: 'NEGATIVE', urgency: 'ELECTIVE', status: HospitalRequestStatus.MATCHED },
    });
    await expect(confirmDelivery.execute({ requestId: request.id })).rejects.toThrow();
  });
});
