import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { ReleaseReservationUseCase } from '../../../../inventory/application/use-cases/release-reservation/release-reservation.use-case';
import { HospitalRequestStatus } from '../../../domain/enums/hospital-request-status.enum';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface CancelHospitalRequestInput {
  requestId: string;
  reason: string;
}

export interface CancelHospitalRequestOutput {
  status: string;
}

/**
 * Cancels a request at any point before allocation. If a component was
 * already reserved, the reservation is released through the Inventory
 * ReleaseReservationUseCase so the stock returns to availability.
 */
@Injectable()
export class CancelHospitalRequestUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    private readonly releaseReservationUseCase: ReleaseReservationUseCase,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: CancelHospitalRequestInput): Promise<CancelHospitalRequestOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }

    if (
      request.linkedComponentId &&
      (request.status === HospitalRequestStatus.RESERVED ||
        request.status === HospitalRequestStatus.CROSSMATCH_CONFIRMED)
    ) {
      await this.releaseReservationUseCase.execute({ componentId: request.linkedComponentId });
    }

    request.cancel(input.reason);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { status: request.status };
  }
}
