import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER } from '../../tokens';

export interface AllocateComponentInput {
  componentId: string;
}

/**
 * Use case: confirms a reserved component was delivered and consumed by
 * the requesting hospital. This must only be called AFTER the physical
 * crossmatch test has been confirmed outside the system - the software
 * orchestrates the workflow, it does not replace the lab test. See
 * FLUXO-OPERACIONAL.md, Fluxo 5.
 */
@Injectable()
export class AllocateComponentUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) { }

  async execute(input: AllocateComponentInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    component.allocate();

    await this.bloodComponentRepository.save(component);
    await this.outboxEventWriter.write(component.pullDomainEvents());
  }
}
