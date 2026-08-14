import { Injectable } from '@nestjs/common';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    ActiveQuestionnaireRow,
    GetActiveQuestionnaireParams,
    IGetActiveQuestionnaireQueryPort,
} from './get-active-questionnaire.port';

/**
 * Read-only projection of the active (most recently published) clinical
 * questionnaire version.
 */
@Injectable()
export class GetActiveQuestionnairePrismaQuery implements IGetActiveQuestionnaireQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetActiveQuestionnaireParams): Promise<ActiveQuestionnaireRow | null> {
        const row = await this.prisma.clinicalQuestionnaireVersion.findFirst({
            where: { tenantId: params.tenantId },
            orderBy: { publishedAt: 'desc' },
        });
        if (!row) return null;

        return {
            id: row.id,
            versionNumber: row.versionNumber,
            publishedAt: row.publishedAt,
            publishedBy: row.publishedBy,
            questions: row.questions as any,
        };
    }
}
