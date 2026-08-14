/**
 * Read model for the regulatory "Hemoprod" report screen
 * (GET /inventory/reports/hemoprod). Production/discard tallies in a period.
 */
export interface HemoprodReportRow {
    componentType: string;
    produced: number;
    discarded: number;
    expired: number;
}

export interface GetHemoprodReportParams {
    tenantId: string;
    days?: number;
    from?: Date;
    to?: Date;
}

export interface IGetHemoprodReportQueryPort {
    execute(params: GetHemoprodReportParams): Promise<HemoprodReportRow[]>;
}
