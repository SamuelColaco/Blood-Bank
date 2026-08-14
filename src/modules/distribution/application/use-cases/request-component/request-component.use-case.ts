import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { BloodType, AboGroup, RhFactor } from '../../../../../shared/domain/blood-type.vo';
import { SpecialProcessing } from '../../../../../shared/domain/special-processing.vo';
import { HospitalRequest } from '../../../domain/entities/hospital-request.entity';
import { Urgency } from '../../../domain/enums/urgency.enum';
import { IHospitalRepository } from '../../../domain/repositories/hospital.repository';
import { IHospitalRequestRepository } from '../../../domain/repositories/hospital-request.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import {
  HOSPITAL_REPOSITORY,
  HOSPITAL_REQUEST_REPOSITORY,
  OUTBOX_EVENT_WRITER,
  TRANSACTION_RUNNER,
} from '../../tokens';

export interface RequestComponentInput {
  tenantId: string;
  hospitalId: string;
  requestedBloodType: {
    aboGroup: AboGroup;
    rhFactor: RhFactor;
    extendedPhenotype?: string;
  };
  requiredSpecialProcessing?: { isIrradiated: boolean; isLeukoreduced: boolean };
  urgency: Urgency;
}

export interface RequestComponentOutput {
  requestId: string;
  status: string;
}

/**
 * UC-01 - Solicitar hemocomponente. A partner hospital asks for a blood
 * type, an urgency and (optionally) special processing; a HospitalRequest
 * is created in REQUESTED. The hospital is validated against the tenant
 * to keep the multi-tenant boundary. SDD Fase 3, section 5, UC-01.
 */
@Injectable()
export class RequestComponentUseCase {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    @Inject(HOSPITAL_REPOSITORY) private readonly hospitalRepository: IHospitalRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: RequestComponentInput): Promise<RequestComponentOutput> {
    const hospital = await this.hospitalRepository.findById(input.hospitalId);
    if (!hospital) {
      throw new DomainError(`Hospital ${input.hospitalId} was not found.`);
    }
    if (hospital.tenantId !== input.tenantId) {
      throw new DomainError(`Hospital ${input.hospitalId} does not belong to tenant ${input.tenantId}.`);
    }

    const request = HospitalRequest.request({
      id: randomUUID(),
      tenantId: input.tenantId,
      hospitalId: input.hospitalId,
      requestedBloodType: BloodType.create(
        input.requestedBloodType.aboGroup,
        input.requestedBloodType.rhFactor,
        input.requestedBloodType.extendedPhenotype,
      ),
      requiredSpecialProcessing: input.requiredSpecialProcessing
        ? SpecialProcessing.create(
          input.requiredSpecialProcessing.isIrradiated,
          input.requiredSpecialProcessing.isLeukoreduced,
        )
        : undefined,
      urgency: input.urgency,
    });

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRequestRepository.save(request, scope);
      await this.outboxEventWriter.write(request.pullDomainEvents(), scope);
    });

    return { requestId: request.id, status: request.status };
  }
}
