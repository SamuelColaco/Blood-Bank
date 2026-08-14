/**
 * Write port for editing per-tenant operational settings (reservation
 * timeouts). The Inventory context exposes this as a write contract; its
 * Prisma implementation persists into Tenant.featureFlags.
 */
export interface TenantSettingsInput {
    electiveReservationTimeoutInDays: number;
    emergencyReservationTimeoutInHours: number;
}

export interface ITenantSettingsWriter {
    update(tenantId: string, settings: TenantSettingsInput): Promise<void>;
}
