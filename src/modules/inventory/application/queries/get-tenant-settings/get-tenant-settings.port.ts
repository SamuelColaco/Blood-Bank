/**
 * Read model for the "Configuração do Tenant" screen
 * (GET /inventory/tenant-settings). Reservoir timeouts + raw feature flags.
 */
export interface TenantSettingsRow {
    tenantId: string;
    electiveReservationTimeoutInDays: number;
    emergencyReservationTimeoutInHours: number;
    featureFlags: Record<string, unknown>;
}

export interface GetTenantSettingsParams {
    tenantId: string;
}

export interface IGetTenantSettingsQueryPort {
    execute(params: GetTenantSettingsParams): Promise<TenantSettingsRow | null>;
}
