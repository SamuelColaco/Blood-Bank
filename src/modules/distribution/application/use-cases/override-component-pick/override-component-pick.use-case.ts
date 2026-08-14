import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { ReservationKind } from '../../../../inventory/domain/value-objects/reservation.vo';
import { ReleaseReservationUseCase } from '../../../../inventory/application/use-cases/release-reservation/release-reservation.use-case';
import { ReserveComponentUseCase } from '../../../../inventory/application/use-cases/reserve-component/reserve-component.use-case';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface OverrideComponentPickInput {
  requestId: string;
  chosenComponentId: string;
  reason?: string;
}

export interface OverrideComponentPickOutput {
  status: string;
  linkedComponentId: string;
}

/**
 * ELECTIVE UX: the hospital overrides the auto-pick with another component
 * from the shortlist. Because the auto-pick was already reserved (to avoid
 * losing it to a concurrent request), overriding releases that reservation
 * and reserves the chosen one - using the existing Inventory
 * ReleaseReservationUseCase / ReserveComponentUseCase, never a new state.
 * The override itself is logged so we can tell whether expiry-based
 * prioritization is actually reducing discard. SDD Fase 3, UC-02 decision.
 */
@Injectable()
export class OverrideComponentPickUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    private readonly releaseReservationUseCase: ReleaseReservationUseCase,
    private readonly reserveComponentUseCase: ReserveComponentUseCase,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: OverrideComponentPickInput): Promise<OverrideComponentPickOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }
    if (!request.awaitingPickConfirmation) {
      throw new DomainError(
        `Hospital request ${input.requestId} is not awaiting a pick confirmation (${request.urgency}).`,
      );
    }
    if (!request.shortlist.some((m) => m.componentId === input.chosenComponentId)) {
      throw new DomainError(
        `Component ${input.chosenComponentId} is not in the shortlist of request ${input.requestId}.`,
      );
    }
    const previous = request.linkedComponentId;
    if (!previous) {
      throw new DomainError(`Hospital request ${input.requestId} has no linked component.`);
    }

    const kind: ReservationKind = request.urgency === 'EMERGENCY' ? 'EMERGENCY' : 'ELECTIVE';
    await this.releaseReservationUseCase.execute({ componentId: previous });
    await this.reserveComponentUseCase.execute({
      componentId: input.chosenComponentId,
      requestedBy: request.id,
      kind,
    });

    request.overridePick(input.chosenComponentId, input.reason);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { status: request.status, linkedComponentId: request.linkedComponentId as string };
  }
}
