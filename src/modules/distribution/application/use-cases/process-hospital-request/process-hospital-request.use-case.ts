import { Inject, Injectable } from '@nestjs/common';
import { AvailableComponentMatch } from '../../../../../shared/domain/ports/available-components-query.port';
import { MatchHospitalRequestUseCase } from '../match-hospital-request/match-hospital-request.use-case';
import { ReserveHospitalRequestUseCase } from '../reserve-hospital-request/reserve-hospital-request.use-case';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { HOSPITAL_REQUEST_REPOSITORY } from '../../tokens';

export interface ProcessHospitalRequestInput {
  requestId: string;
}

export interface ProcessHospitalRequestOutput {
  requestId: string;
  status: string;
  linkedComponentId: string | null;
  shortlist: AvailableComponentMatch[];
  awaitingPickConfirmation: boolean;
  rejectionReason: string | null;
}

/**
 * Automatic pipeline executed right after UC-01: UC-02 (match) followed by
 * UC-03 (reserve). For EMERGENCY the auto-picked component is reserved
 * immediately and the flow proceeds (shortlist is transparency only); for
 * ELECTIVE the pick is ALSO reserved immediately (so a concurrent request
 * cannot steal it while the hospital decides) but the request waits for the
 * hospital to confirm or override the auto-pick. SDD Fase 3, section 5.
 */
@Injectable()
export class ProcessHospitalRequestUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    private readonly matchHospitalRequestUseCase: MatchHospitalRequestUseCase,
    private readonly reserveHospitalRequestUseCase: ReserveHospitalRequestUseCase,
  ) { }

  async execute(input: ProcessHospitalRequestInput): Promise<ProcessHospitalRequestOutput> {
    const request = await this.hospitalRequestRepository.findById(input.requestId);
    if (!request) {
      throw new DomainError(`Hospital request ${input.requestId} was not found.`);
    }

    const matchResult = await this.matchHospitalRequestUseCase.execute({ requestId: request.id });
    if (matchResult.status === 'REJECTED') {
      return {
        requestId: request.id,
        status: matchResult.status,
        linkedComponentId: null,
        shortlist: [],
        awaitingPickConfirmation: false,
        rejectionReason: matchResult.rejectionReason,
      };
    }

    const reserveResult = await this.reserveHospitalRequestUseCase.execute({ requestId: request.id });

    return {
      requestId: request.id,
      status: reserveResult.status,
      linkedComponentId: reserveResult.linkedComponentId,
      shortlist: matchResult.shortlist,
      awaitingPickConfirmation: request.awaitingPickConfirmation,
      rejectionReason: null,
    };
  }
}
