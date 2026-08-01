import { TenantSettings } from '../value-objects/tenant-settings.vo';

export interface ITenantSettingsRepository {
    findByTenantId(tenantId: string): Promise<TenantSettings | null>;
}
