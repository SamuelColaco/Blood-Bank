import type { DiscardCauseRow, PeriodFilter } from '../get-discard-causes-breakdown/get-discard-causes-breakdown.port';

/**
 * Read model for the "Relatórios → Descarte (causa raiz)" screen
 * (GET /inventory/reports/discard-root-cause). The same discard-cause base
 * data as the dashboard breakdown, but with a configurable period.
 */
export interface IGetDiscardRootCauseReportQueryPort {
    execute(params: PeriodFilter): Promise<DiscardCauseRow[]>;
}
