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

/** Lightweight authority check (hotspot resolution) until full RBAC lands - see SDD Fase 3, section 7. */
const CROSSMATCH_AUTHORIZED_ROLES = new Set(['LABORATORY', 'LAB']);

export interface ConfirmCrossmatchInput {
  requestId: string;
  crossmatchReference: string;
  confirmedBy: string;
  role: string;
}

export interface ConfirmCrossmatchOutput {
  status: string;
}

/**
 * UC-04 - Confirmar crossmatch. Registers the physical lab result on the
 * request. The actual crossmatch test happens outside the system; this is
 * the software barrier that makes UC-05 (allocate) impossible without a
 * confirmed reference - enforced both here and in the Inventory retrofit
 * (BloodComponent.allocate requires it). SDD Fase 3, section 5, UC-04.
 */
@Injectable()
export class ConfirmCrossmatchUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: ConfirmCrossmatchInput): Promise<ConfirmCrossmatchOutput> {
    if (!CROSSMATCH_AUTHORIZED_ROLES.has(input.role)) {
      throw new DomainError(`Role "${input.role}" is not authorized to confirm a crossmatch.`);
    }

    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }

    request.confirmCrossmatch(input.crossmatchReference, input.confirmedBy, input.role);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { status: request.status };
  }
}
