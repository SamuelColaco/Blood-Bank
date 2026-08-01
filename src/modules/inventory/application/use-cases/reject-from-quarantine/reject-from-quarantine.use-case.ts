import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER } from '../../tokens';

export interface RejectFromQuarantineInput {
  componentId: string;
}

/**
 * Use case: rejects a component after a positive serology result.
 * Invoked only by the reaction policy to "ResultadoTriagemRecebido" -
 * never triggered manually. The component itself is not discarded here;
 * discard is a separate, explicit step (see DiscardComponentUseCase),
 * so the reason for removal from stock is always recorded distinctly.
 */
@Injectable()
export class RejectFromQuarantineUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) {}

  async execute(input: RejectFromQuarantineInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    component.rejectFromQuarantine();

    await this.bloodComponentRepository.save(component);
    await this.outboxEventWriter.write(component.pullDomainEvents());
  }
}
