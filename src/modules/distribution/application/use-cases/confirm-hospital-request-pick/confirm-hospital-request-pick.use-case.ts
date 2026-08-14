import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface ConfirmPickInput {
  requestId: string;
}

export interface ConfirmPickOutput {
  status: string;
}

/**
 * ELECTIVE UX: the hospital confirms the auto-picked component (no
 * override). Only valid while the request is awaiting a pick confirmation.
 */
@Injectable()
export class ConfirmHospitalRequestPickUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: ConfirmPickInput): Promise<ConfirmPickOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }

    request.confirmPick();

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { status: request.status };
  }
}
