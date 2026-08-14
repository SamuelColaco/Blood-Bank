import { Injectable } from '@nestjs/common';
import { GetDiscardCausesBreakdownPrismaQuery } from '../get-discard-causes-breakdown/get-discard-causes-breakdown.prisma-query';
import type { DiscardCauseRow, PeriodFilter } from '../get-discard-causes-breakdown/get-discard-causes-breakdown.port';
import type { IGetDiscardRootCauseReportQueryPort } from './get-discard-root-cause-report.port';

/**
 * Read-only projection for the discard root-cause report - same data as the
 * dashboard breakdown, exposed with a configurable period.
 */
@Injectable()
export class GetDiscardRootCauseReportPrismaQuery
    extends GetDiscardCausesBreakdownPrismaQuery
    implements IGetDiscardRootCauseReportQueryPort {
    execute(params: PeriodFilter): Promise<DiscardCauseRow[]> {
        return super.execute(params);
    }
}
