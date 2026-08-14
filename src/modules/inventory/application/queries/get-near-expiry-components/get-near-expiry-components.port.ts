/**
 * Read model for the Dashboard de Estoque "near expiry" list
 * (GET /inventory/stock/near-expiry). Components still stored that will
 * expire within a configurable window.
 */
export interface NearExpiryComponentRow {
    id: string;
    componentType: string;
    aboGroup: string;
    rhFactor: string;
    collectedAt: Date;
    expiresAt: Date;
    daysUntilExpiration: number;
}

export interface GetNearExpiryComponentsParams {
    tenantId: string;
    /** How many days ahead to include components, e.g. 5. */
    withinDays: number;
}

export interface IGetNearExpiryComponentsQueryPort {
    execute(params: GetNearExpiryComponentsParams): Promise<NearExpiryComponentRow[]>;
}
