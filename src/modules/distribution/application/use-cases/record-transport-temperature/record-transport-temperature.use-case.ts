import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { ITransportContainerRepository } from '../../../domain/repositories/transport-container.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  TRANSPORT_CONTAINER_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface RecordTransportTemperatureInput {
  containerId: string;
  value: number;
}

/**
 * UC-07 - Monitorar temperatura em trânsito. A sensor (or a fallback manual
 * entry - hotspot resolution) records a reading on the container. If it
 * leaves the safe range, an event is raised and the linked component is
 * reevaluated asynchronously by the handler - the same eventually-consistent
 * cold-chain pattern validated in Fase 1. SDD Fase 3, section 5, UC-07.
 */
@Injectable()
export class RecordTransportTemperatureReadingUseCase {
  constructor(
    @Inject(TRANSPORT_CONTAINER_REPOSITORY)
    private readonly transportContainerRepository: ITransportContainerRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: RecordTransportTemperatureInput): Promise<void> {
    const container = await this.transportContainerRepository.findById(input.containerId);
    if (!container) {
      throw new DomainError(`Transport container ${input.containerId} was not found.`);
    }

    container.recordTemperatureReading(input.value);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.transportContainerRepository.save(container, scope);
      await this.transportContainerRepository.saveTemperatureReading(container.id, input.value, scope);
      await this.outboxEventWriter.write(container.pullDomainEvents(), scope);
    });
  }
}
