import { Injectable } from '@nestjs/common';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    GetPendingDoubleSignatureParams,
    IGetPendingDoubleSignatureQueryPort,
    PendingDoubleSignatureRow,
} from './get-pending-double-signature.port';

/**
 * Read-only projection of donations awaiting the double-signature approval
 * step. A donation qualifies when any answer to a question flagged
 * `requiresDoubleSignature` is positive AND the donation has not yet been
 * collected (approval happens before collection).
 */
@Injectable()
export class GetPendingDoubleSignaturePrismaQuery implements IGetPendingDoubleSignatureQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetPendingDoubleSignatureParams): Promise<PendingDoubleSignatureRow[]> {
        // Map version id -> set of question ids that require double signature.
        const versions = await this.prisma.clinicalQuestionnaireVersion.findMany({
            where: { tenantId: params.tenantId },
            select: { id: true, questions: true },
        });
        const flaggedByVersion = new Map<string, Set<string>>();
        for (const v of versions) {
            const flagged = (v.questions as any[] ?? [])
                .filter((q) => q.requiresDoubleSignature === true)
                .map((q) => String(q.id));
            if (flagged.length > 0) flaggedByVersion.set(v.id, new Set(flagged));
        }
        if (flaggedByVersion.size === 0) return [];

        const rows = await this.prisma.donation.findMany({
            where: {
                tenantId: params.tenantId,
                collectedAt: null,
                questionnaireVersionId: { in: [...flaggedByVersion.keys()] },
            },
            include: { donor: true },
            orderBy: { createdAt: 'asc' },
        });

        const result: PendingDoubleSignatureRow[] = [];
        for (const row of rows) {
            if (!row.questionnaireVersionId) continue;
            const flagged = flaggedByVersion.get(row.questionnaireVersionId);
            if (!flagged) continue;
            const snapshot = row.questionnaireSnapshot as { answers: { questionId: string; answer: boolean }[] } | null;
            const answers = snapshot?.answers ?? [];
            const hasPositiveFlagged = answers.some(
                (a) => flagged.has(String(a.questionId)) && a.answer === true,
            );
            if (hasPositiveFlagged) {
                result.push({
                    id: row.id,
                    donorName: row.donor.fullName,
                    requiresDoubleSignature: true,
                    questionnaireVersionId: row.questionnaireVersionId,
                    checkedInAt: row.createdAt,
                });
            }
        }
        return result;
    }
}
