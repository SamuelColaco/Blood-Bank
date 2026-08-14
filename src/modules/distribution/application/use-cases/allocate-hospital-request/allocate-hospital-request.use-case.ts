import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { AllocateComponentUseCase } from '../../../../inventory/application/use-cases/allocate-component/allocate-component.use-case';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface AllocateHospitalRequestInput {
  requestId: string;
}

export interface AllocateHospitalRequestOutput {
  status: string;
}

/**
 * UC-05 - Alocar. Invokes the Inventory AllocateComponentUseCase passing
 * the crossmatch reference recorded in UC-04 - Distribuição never
 * reimplements allocate(). Runs after CROSSMATCH_CONFIRMED, so the domain
 * (here and in BloodComponent) guarantees allocation cannot happen without
 * a confirmed crossmatch. SDD Fase 3, section 5, UC-05.
 */
@Injectable()
export class AllocateHospitalRequestUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    private readonly allocateComponentUseCase: AllocateComponentUseCase,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: AllocateHospitalRequestInput): Promise<AllocateHospitalRequestOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }
    if (!request.linkedComponentId || !request.crossmatchReference) {
      throw new DomainError(`Hospital request ${input.requestId} is not ready to be allocated.`);
    }

    await this.allocateComponentUseCase.execute({
      componentId: request.linkedComponentId,
      crossmatchReference: request.crossmatchReference,
    });

    request.allocate();

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { status: request.status };
  }
}
