import { Inject, Injectable } from '@nestjs/common';
import { TENANT_SETTINGS_QUERY } from '../../tokens';
import {
    GetTenantSettingsParams,
    IGetTenantSettingsQueryPort,
    TenantSettingsRow,
} from './get-tenant-settings.port';

/**
 * Screen query: ConfiguraÃ§Ã£o do Tenant.
 */
@Injectable()
export class GetTenantSettingsQuery {
    constructor(
        @Inject(TENANT_SETTINGS_QUERY)
        private readonly port: IGetTenantSettingsQueryPort,
    ) { }

    execute(params: GetTenantSettingsParams): Promise<TenantSettingsRow | null> {
        return this.port.execute(params);
    }
}
