import { Inject, Injectable } from '@nestjs/common';
import { ClinicalQuestionnaireVersion } from '../../../domain/entities/clinical-questionnaire-version.entity';
import { Question } from '../../../domain/entities/clinical-questionnaire-version.entity';
import { IClinicalQuestionnaireVersionRepository } from '../../../domain/repositories/clinical-questionnaire-version.repository';
import { IOutboxEventWriter } from '../../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../../../../shared/domain/transaction-runner.port';
import { DonationTokens } from '../../tokens';

export interface PublishQuestionnaireVersionInput {
    tenantId: string;
    publishedBy: string;
    questions: Question[];
}

export interface PublishQuestionnaireVersionOutput {
    versionId: string;
    versionNumber: number;
}

/**
 * UC-07: Publish a new version of the clinical questionnaire.
 *
 * Versions are immutable once published - a new version is created for any
 * change. This preserves the exact questions and criteria that were active
 * at the time of any donation.
 */
@Injectable()
export class PublishQuestionnaireVersionUseCase {
    constructor(
        @Inject(DonationTokens.CLINICAL_QUESTIONNAIRE_VERSION_REPOSITORY) private readonly questionnaireRepository: IClinicalQuestionnaireVersionRepository,
        @Inject(DonationTokens.OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
        @Inject(DonationTokens.TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    ) { }

    async execute(input: PublishQuestionnaireVersionInput): Promise<PublishQuestionnaireVersionOutput> {
        const existingVersions = await this.questionnaireRepository.findActiveByTenantId(input.tenantId);
        const nextVersionNumber = existingVersions ? existingVersions.versionNumberValue + 1 : 1;

        const version = ClinicalQuestionnaireVersion.publish({
            id: `questionnaire-version-${nextVersionNumber}`,
            tenantId: input.tenantId,
            versionNumber: nextVersionNumber,
            publishedBy: input.publishedBy,
            questions: input.questions,
        });

        await this.transactionRunner.runInTransaction(async (scope) => {
            await this.questionnaireRepository.save(version, scope);
            await this.outboxEventWriter.write(version.pullDomainEvents());
        });

        return {
            versionId: version.id,
            versionNumber: version.versionNumberValue,
        };
    }
}
