import { Inject, Injectable } from '@nestjs/common';
import { DISCARD_ROOT_CAUSE_REPORT_QUERY } from '../../tokens';
import type { DiscardCauseRow, PeriodFilter } from '../get-discard-causes-breakdown/get-discard-causes-breakdown.port';
import type { IGetDiscardRootCauseReportQueryPort } from './get-discard-root-cause-report.port';

/**
 * Screen query: RelatÃ³rios - Descarte (causa raiz).
 */
@Injectable()
export class GetDiscardRootCauseReportQuery {
    constructor(
        @Inject(DISCARD_ROOT_CAUSE_REPORT_QUERY)
        private readonly port: IGetDiscardRootCauseReportQueryPort,
    ) { }

    execute(params: PeriodFilter): Promise<DiscardCauseRow[]> {
        return this.port.execute(params);
    }
}
