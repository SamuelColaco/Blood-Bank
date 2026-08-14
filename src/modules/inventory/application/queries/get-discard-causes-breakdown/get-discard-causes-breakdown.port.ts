/**
 * Read model for the Dashboard de Estoque "discard causes" breakdown
 * (GET /inventory/stock/discard-causes). Counts of discarded components
 * grouped by DiscardReason within a period.
 */
export interface DiscardCauseRow {
    reason: string;
    count: number;
}

/** A period expressed either as a number of trailing days or an explicit range. */
export interface PeriodFilter {
    tenantId: string;
    /** Trailing days, e.g. 30. Mutually exclusive with from/to. */
    days?: number;
    from?: Date;
    to?: Date;
}

export interface IGetDiscardCausesBreakdownQueryPort {
    execute(params: PeriodFilter): Promise<DiscardCauseRow[]>;
}
