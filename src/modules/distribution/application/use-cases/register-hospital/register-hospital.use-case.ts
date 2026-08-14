import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Hospital } from '../../../domain/entities/hospital.entity';
import { IHospitalRepository } from '../../../domain/repositories/hospital.repository';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { HOSPITAL_REPOSITORY, TRANSACTION_RUNNER } from '../../tokens';

export interface RegisterHospitalInput {
  tenantId: string;
  name: string;
}

export interface RegisterHospitalOutput {
  hospitalId: string;
}

/** Seed/registration entry point for the partner-hospital directory. */
@Injectable()
export class RegisterHospitalUseCase {
  constructor(
    @Inject(HOSPITAL_REPOSITORY) private readonly hospitalRepository: IHospitalRepository,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
  ) { }

  async execute(input: RegisterHospitalInput): Promise<RegisterHospitalOutput> {
    const hospital = Hospital.register({
      id: randomUUID(),
      tenantId: input.tenantId,
      name: input.name,
    });

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.hospitalRepository.save(hospital, scope);
    });

    return { hospitalId: hospital.id };
  }
}
