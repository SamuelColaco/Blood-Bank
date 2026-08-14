import { Injectable } from '@nestjs/common';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    GetQuestionnaireVersionsParams,
    IGetQuestionnaireVersionsQueryPort,
    QuestionnaireVersionRow,
} from './get-questionnaire-versions.port';

/**
 * Read-only projection listing all published questionnaire versions,
 * newest first.
 */
@Injectable()
export class GetQuestionnaireVersionsPrismaQuery implements IGetQuestionnaireVersionsQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetQuestionnaireVersionsParams): Promise<QuestionnaireVersionRow[]> {
        const rows = await this.prisma.clinicalQuestionnaireVersion.findMany({
            where: { tenantId: params.tenantId },
            orderBy: { publishedAt: 'desc' },
        });

        return rows.map((row) => ({
            id: row.id,
            versionNumber: row.versionNumber,
            publishedAt: row.publishedAt,
            publishedBy: row.publishedBy,
            questions: row.questions as any,
        }));
    }
}
