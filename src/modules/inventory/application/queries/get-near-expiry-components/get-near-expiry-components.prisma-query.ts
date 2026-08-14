import { Injectable } from '@nestjs/common';
import { ComponentStatus } from '../../../domain/enums/component-status.enum';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    GetNearExpiryComponentsParams,
    IGetNearExpiryComponentsQueryPort,
    NearExpiryComponentRow,
} from './get-near-expiry-components.port';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Read-only projection of stored components expiring within a window.
 */
@Injectable()
export class GetNearExpiryComponentsPrismaQuery implements IGetNearExpiryComponentsQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetNearExpiryComponentsParams): Promise<NearExpiryComponentRow[]> {
        const now = new Date();
        const horizon = new Date(now.getTime() + params.withinDays * MS_PER_DAY);

        const rows = await this.prisma.bloodComponent.findMany({
            where: {
                tenantId: params.tenantId,
                status: ComponentStatus.STORED,
                expiresAt: { gte: now, lte: horizon },
            },
            orderBy: { expiresAt: 'asc' },
        });

        return rows.map((row) => ({
            id: row.id,
            componentType: row.componentType,
            aboGroup: row.aboGroup,
            rhFactor: row.rhFactor,
            collectedAt: row.collectedAt,
            expiresAt: row.expiresAt,
            daysUntilExpiration: Math.max(
                0,
                Math.ceil((row.expiresAt.getTime() - now.getTime()) / MS_PER_DAY),
            ),
        }));
    }
}
