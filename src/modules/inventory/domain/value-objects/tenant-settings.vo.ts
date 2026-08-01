/**
 * Immutable value object carrying per-tenant operational settings.
 *
 * This is NOT an entity: it has no identity beyond the tenantId it
 * belongs to, and it is never mutated after creation. It is read from
 * Tenant.featureFlags at the infrastructure boundary and handed to the
 * application layer as a plain data carrier.
 */
export class TenantSettings {
    private constructor(
        public readonly tenantId: string,
        public readonly electiveReservationTimeoutInDays: number,
        public readonly emergencyReservationTimeoutInHours: number,
    ) { }

    static defaults(tenantId: string): TenantSettings {
        return new TenantSettings(tenantId, 3, 2);
    }

    static create(
        tenantId: string,
        electiveReservationTimeoutInDays: number,
        emergencyReservationTimeoutInHours: number,
    ): TenantSettings {
        return new TenantSettings(tenantId, electiveReservationTimeoutInDays, emergencyReservationTimeoutInHours);
    }
}
