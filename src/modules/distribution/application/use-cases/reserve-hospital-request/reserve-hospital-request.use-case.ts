import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { ReservationKind } from '../../../../inventory/domain/value-objects/reservation.vo';
import { ReserveComponentUseCase } from '../../../../inventory/application/use-cases/reserve-component/reserve-component.use-case';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface ReserveHospitalRequestInput {
  requestId: string;
}

export interface ReserveHospitalRequestOutput {
  status: string;
  linkedComponentId: string;
}

/**
 * UC-03 - Reservar. Reserves the auto-picked component by INVOKING the
 * Inventory ReserveComponentUseCase - Distribuição never reimplements
 * reserve(), it just passes the parameters the request determined. The
 * urgency drives the reservation timeout through the already-per-tenant
 * TenantSettings (no domain change needed - SDD Fase 3, section 5, UC-03).
 */
@Injectable()
export class ReserveHospitalRequestUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    private readonly reserveComponentUseCase: ReserveComponentUseCase,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: ReserveHospitalRequestInput): Promise<ReserveHospitalRequestOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }
    if (!request.linkedComponentId) {
      throw new DomainError(`Hospital request ${input.requestId} has no matched component to reserve.`);
    }

    const kind: ReservationKind = request.urgency === 'EMERGENCY' ? 'EMERGENCY' : 'ELECTIVE';
    await this.reserveComponentUseCase.execute({
      componentId: request.linkedComponentId,
      requestedBy: request.id,
      kind,
    });

    request.reserve();

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { status: request.status, linkedComponentId: request.linkedComponentId };
  }
}
