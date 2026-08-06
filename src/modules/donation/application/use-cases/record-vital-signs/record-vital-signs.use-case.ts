import { Inject, Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { VitalSigns } from '../../../domain/value-objects/vital-signs.vo';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface RecordVitalSignsInput {
    donationId: string;
    weightInKg: number;
    hemoglobinInGdl: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
}

export interface RecordVitalSignsOutput {
    success: boolean;
}

/**
 * UC-03: Record vital signs for a donation.
 *
 * Validates that the questionnaire has been completed before allowing
 * vital signs to be recorded. The clinical values are wrapped in the
 * VitalSigns value object; the actual sex-dependent eligibility check
 * happens at approval time (UC-04), not here.
 */
@Injectable()
export class RecordVitalSignsUseCase {
    constructor(
        @Inject(DonationTokens.DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: RecordVitalSignsInput): Promise<RecordVitalSignsOutput> {
        const donation = await this.donationRepository.findById(input.donationId);
        if (!donation) {
            throw new DomainError(`Donation ${input.donationId} not found.`);
        }

        if (donation.questionnaireSnapshot === null) {
            throw new DomainError(`Cannot record vital signs for donation ${input.donationId}: questionnaire not completed.`);
        }

        const vitalSigns = VitalSigns.create({
            weightInKg: input.weightInKg,
            hemoglobinInGdl: input.hemoglobinInGdl,
            bloodPressureSys: input.bloodPressureSys,
            bloodPressureDia: input.bloodPressureDia,
        });

        donation.recordVitalSigns(vitalSigns);

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.donationRepository.save(donation, scope);
            await this.outboxEventWriter.write(donation.pullDomainEvents(), scope);
        });

        return { success: true };
    }
}
