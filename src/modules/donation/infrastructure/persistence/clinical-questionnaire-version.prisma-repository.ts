import { Injectable } from '@nestjs/common';
import { ClinicalQuestionnaireVersion } from '../../domain/entities/clinical-questionnaire-version.entity';
import { IClinicalQuestionnaireVersionRepository } from '../../domain/repositories/clinical-questionnaire-version.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { DonationPrismaService } from './donation-prisma.service';
import { DonationPrismaTransactionRunner } from './transaction-runner';

@Injectable()
export class ClinicalQuestionnaireVersionPrismaRepository implements IClinicalQuestionnaireVersionRepository {
    constructor(
        private readonly prisma: DonationPrismaService,
        private readonly transactionRunner: DonationPrismaTransactionRunner,
    ) { }

    async findById(id: string): Promise<ClinicalQuestionnaireVersion | null> {
        const row = await this.prisma.clinicalQuestionnaireVersion.findUnique({ where: { id } });
        if (!row) return null;
        return ClinicalQuestionnaireVersion.restore({
            id: row.id,
            tenantId: row.tenantId,
            versionNumber: row.versionNumber,
            publishedAt: row.publishedAt,
            publishedBy: row.publishedBy,
            questions: row.questions as any[],
        });
    }

    async findActiveByTenantId(tenantId: string): Promise<ClinicalQuestionnaireVersion | null> {
        const row = await this.prisma.clinicalQuestionnaireVersion.findFirst({
            where: { tenantId },
            orderBy: { publishedAt: 'desc' },
        });
        if (!row) return null;
        return ClinicalQuestionnaireVersion.restore({
            id: row.id,
            tenantId: row.tenantId,
            versionNumber: row.versionNumber,
            publishedAt: row.publishedAt,
            publishedBy: row.publishedBy,
            questions: row.questions as any[],
        });
    }

    async save(version: ClinicalQuestionnaireVersion, scope?: ITransactionScope): Promise<void> {
        const client = scope
            ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
            : this.prisma;

        await client.clinicalQuestionnaireVersion.upsert({
            where: { id: version.id },
            create: {
                id: version.id,
                tenantId: version.tenantId,
                versionNumber: version.versionNumber,
                publishedAt: version.publishedAtValue,
                publishedBy: version.publishedByValue,
                questions: version.questionsValue as any,
            },
            update: {
                versionNumber: version.versionNumber,
                publishedAt: version.publishedAtValue,
                publishedBy: version.publishedByValue,
                questions: version.questionsValue as any,
            },
        });
    }
}
