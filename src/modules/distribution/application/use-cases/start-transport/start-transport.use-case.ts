import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { HospitalRequestStatus } from '../../../domain/enums/hospital-request-status.enum';
import { TransportContainer } from '../../../domain/entities/transport-container.entity';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { ITransportContainerRepository } from '../../../domain/repositories/transport-container.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  TRANSPORT_CONTAINER_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface StartTransportInput {
  requestId: string;
  minTemperature: number;
  maxTemperature: number;
}

export interface StartTransportOutput {
  containerId: string;
}

/**
 * UC-06 - Iniciar transporte. Creates a TransportContainer bound to an
 * ALLOCATED HospitalRequest with its safe temperature range - the start of
 * transit. SDD Fase 3, section 5, UC-06.
 */
@Injectable()
export class StartTransportUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    @Inject(TRANSPORT_CONTAINER_REPOSITORY)
    private readonly transportContainerRepository: ITransportContainerRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: StartTransportInput): Promise<StartTransportOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }
    if (request.status !== HospitalRequestStatus.ALLOCATED) {
      throw new DomainError(
        `Cannot start transport for request ${input.requestId} in status ${request.status}; expected ${HospitalRequestStatus.ALLOCATED}.`,
      );
    }

    const container = TransportContainer.start({
      id: randomUUID(),
      tenantId: request.tenantId,
      linkedHospitalRequestId: request.id,
      minTemperature: input.minTemperature,
      maxTemperature: input.maxTemperature,
    });

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.transportContainerRepository.save(container, scope);
      await this.outboxEventWriter.write(container.pullDomainEvents(), scope);
    });

    return { containerId: container.id };
  }
}
