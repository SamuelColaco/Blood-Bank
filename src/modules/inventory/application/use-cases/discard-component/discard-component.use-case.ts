import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { DiscardReason } from '../../../domain/enums/discard-reason.enum';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER, TRANSACTION_RUNNER } from '../../tokens';

export interface DiscardComponentInput {
  componentId: string;
  reason: DiscardReason;
  /** Whoever authorized the discard - required for the double-check rule described in FLUXO-OPERACIONAL.md, Fluxo 7. */
  authorizedBy: string;
}

/**
 * Use case: discards a component. The reason is mandatory by contract
 * (see BloodComponent.discard) - this is what feeds the discard-cause
 * metrics from PRODUTO.md, and what the double-check/compliance rule
 * depends on. `authorizedBy` is carried through to the audit trail via
 * the domain event, even though the aggregate itself doesn't need it to
 * enforce its own invariants.
 */
@Injectable()
export class DiscardComponentUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: DiscardComponentInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    component.discard(input.reason);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.bloodComponentRepository.save(component, scope);
      await this.outboxEventWriter.write(component.pullDomainEvents(), scope);
    });
  }
}
