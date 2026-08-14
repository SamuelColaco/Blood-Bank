import { Injectable } from '@nestjs/common';
import { ComponentStatus } from '../../../domain/enums/component-status.enum';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    GetStockSummaryParams,
    IGetStockSummaryQueryPort,
    StockCriticality,
    StockSummaryRow,
} from './get-stock-summary.port';

/**
 * Read-only stock summary projection. Counts STORED components per ABO/Rh
 * and derives a criticality status.
 *
 * NOTE: thresholds below are engineering defaults - they should be moved to
 * tenant settings before production (see TenantSettings).
 */
@Injectable()
export class GetStockSummaryPrismaQuery implements IGetStockSummaryQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetStockSummaryParams): Promise<StockSummaryRow[]> {
        const grouped = await this.prisma.bloodComponent.groupBy({
            by: ['aboGroup', 'rhFactor'],
            where: { tenantId: params.tenantId, status: ComponentStatus.STORED },
            _count: { _all: true },
        });

        return grouped.map((row) => ({
            aboGroup: row.aboGroup,
            rhFactor: row.rhFactor,
            quantity: row._count._all,
            status: this.criticality(row._count._all),
        }));
    }

    private criticality(quantity: number): StockCriticality {
        if (quantity <= 1) return 'CRITICAL';
        if (quantity <= 3) return 'LOW';
        if (quantity <= 7) return 'NORMAL';
        return 'SURPLUS';
    }
}
