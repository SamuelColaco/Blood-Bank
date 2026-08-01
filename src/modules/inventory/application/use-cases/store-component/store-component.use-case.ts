import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER } from '../../tokens';

export interface StoreComponentInput {
  componentId: string;
}

/** Use case: moves a cleared component into active, available stock. */
@Injectable()
export class StoreComponentUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) {}

  async execute(input: StoreComponentInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    component.store();

    await this.bloodComponentRepository.save(component);
    await this.outboxEventWriter.write(component.pullDomainEvents());
  }
}
