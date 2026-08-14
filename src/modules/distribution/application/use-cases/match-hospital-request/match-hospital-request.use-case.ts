import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import {
  AVAILABLE_COMPONENTS_QUERY,
  AvailableComponentMatch,
  IAvailableComponentsQuery,
} from '../../../../../shared/domain/ports/available-components-query.port';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface MatchHospitalRequestInput {
  requestId: string;
}

export interface MatchHospitalRequestOutput {
  status: string;
  linkedComponentId: string | null;
  shortlist: AvailableComponentMatch[];
  rejectionReason: string | null;
}

/** Cap on the shortlist offered back to the hospital - a quick decision aid, not a catalog. */
const MAX_SHORTLIST = 5;

/**
 * UC-02 - Buscar compatibilidade. Invokes the Inventory availability query
 * (a shared, read-only port - Distribuição never reads BloodComponent
 * directly), filtering by compatible blood type (O- universal donor via the
 * standard ABO/Rh matrix), required special processing and non-expiry. The
 * nearest-to-expiry component is auto-picked and a capped shortlist is
 * returned. If nothing matches, the request is REJECTED with a reason.
 * SDD Fase 3, section 5, UC-02.
 */
@Injectable()
export class MatchHospitalRequestUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    @Inject(AVAILABLE_COMPONENTS_QUERY)
    private readonly availableComponentsQuery: IAvailableComponentsQuery,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: MatchHospitalRequestInput): Promise<MatchHospitalRequestOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }

    const matches = await this.availableComponentsQuery.findCompatible({
      tenantId: request.tenantId,
      requestedBloodType: request.requestedBloodType,
      requiredSpecialProcessing: request.requiredSpecialProcessing ?? undefined,
      urgency: request.urgency,
    });

    if (matches.length === 0) {
      const reason = 'No compatible component available in stock.';
      request.reject(reason);
      await this.transactionRunner.runInTransaction(async (scope) => {
        await this.hospitalRequestRepository.save(request, scope);
        await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
      });
      return { status: request.status, linkedComponentId: null, shortlist: [], rejectionReason: reason };
    }

    const shortlist = matches.slice(0, MAX_SHORTLIST);
    const autoPick = shortlist[0];
    request.match(autoPick.componentId, shortlist);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return {
      status: request.status,
      linkedComponentId: autoPick.componentId,
      shortlist,
      rejectionReason: null,
    };
  }
}
