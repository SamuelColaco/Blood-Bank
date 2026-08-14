import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    GetScreeningQueueParams,
    IGetScreeningQueueQueryPort,
    ScreeningQueueRow,
} from './get-screening-queue.port';

/**
 * Read-only projection of the donations awaiting clinical screening,
 * ordered by check-in (creation) time - first checked in, first served.
 */
@Injectable()
export class GetScreeningQueuePrismaQuery implements IGetScreeningQueueQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetScreeningQueueParams): Promise<ScreeningQueueRow[]> {
        const rows = await this.prisma.donation.findMany({
            where: {
                tenantId: params.tenantId,
                collectedAt: null,
                questionnaireSnapshot: { equals: Prisma.DbNull },
            },
            include: { donor: true },
            orderBy: { createdAt: 'asc' },
        });

        return rows.map((row) => ({
            id: row.id,
            donorName: row.donor.fullName,
            donationType: row.donationType as 'WHOLE_BLOOD' | 'APHERESIS',
            questionnaireRecorded: false,
            vitalSignsRecorded: row.vitalSignsRecorded,
            checkedInAt: row.createdAt,
        }));
    }
}
