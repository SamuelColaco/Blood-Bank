import { Inject, Injectable } from '@nestjs/common';
import { ITenantSettingsWriter, TenantSettingsInput } from '../../ports/tenant-settings-writer.port';
import { TENANT_SETTINGS_WRITER } from '../../tokens';

/**
 * Use case: update per-tenant operational settings (reservation timeouts).
 * This was a missing write - only the read path existed before. See SDD
 * "Endpoints de API Faltando" §2.2.
 */
@Injectable()
export class UpdateTenantSettingsUseCase {
    constructor(
        @Inject(TENANT_SETTINGS_WRITER) private readonly writer: ITenantSettingsWriter,
    ) { }

    async execute(tenantId: string, settings: TenantSettingsInput): Promise<void> {
        await this.writer.update(tenantId, settings);
    }
}
