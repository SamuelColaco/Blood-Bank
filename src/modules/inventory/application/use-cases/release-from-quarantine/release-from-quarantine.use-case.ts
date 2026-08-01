import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER } from '../../tokens';

export interface ReleaseFromQuarantineInput {
  componentId: string;
}

/**
 * Use case: releases a component from quarantine after a negative
 * serology result. In production this is invoked ONLY by the policy that
 * reacts to a "ResultadoTriagemRecebido" event from Donation & Screening -
 * there is deliberately no manual/admin entry point for this action.
 */
@Injectable()
export class ReleaseFromQuarantineUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) {}

  async execute(input: ReleaseFromQuarantineInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    component.releaseFromQuarantine();

    await this.bloodComponentRepository.save(component);
    await this.outboxEventWriter.write(component.pullDomainEvents());
  }
}
