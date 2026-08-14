import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER, TRANSACTION_RUNNER } from '../../tokens';

export interface LeukoreduceComponentInput {
  componentId: string;
}

/**
 * Use case: applies physical leukoreduction to a stored blood component.
 * Same invariant and pattern as IrradiateComponentUseCase - see SDD Fase 3,
 * section 3.2.
 */
@Injectable()
export class LeukoreduceComponentUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: LeukoreduceComponentInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    component.applyLeukoreduction();

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.bloodComponentRepository.save(component, scope);
      await this.outboxEventWriter.write(component.pullDomainEvents(), scope);
    });
  }
}
