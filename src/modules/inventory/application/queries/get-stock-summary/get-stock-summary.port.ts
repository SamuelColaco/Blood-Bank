/**
 * Read model for the Dashboard de Estoque "stock summary"
 * (GET /inventory/stock/summary). One row per ABO/Rh combination with the
 * stored quantity and a derived criticality status.
 */
export type StockCriticality = 'CRITICAL' | 'LOW' | 'NORMAL' | 'SURPLUS';

export interface StockSummaryRow {
    aboGroup: string;
    rhFactor: string;
    quantity: number;
    status: StockCriticality;
}

export interface GetStockSummaryParams {
    tenantId: string;
}

export interface IGetStockSummaryQueryPort {
    execute(params: GetStockSummaryParams): Promise<StockSummaryRow[]>;
}
