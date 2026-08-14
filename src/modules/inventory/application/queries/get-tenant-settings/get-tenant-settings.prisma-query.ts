import { Injectable } from '@nestjs/common';
import { TenantSettings } from '../../../domain/value-objects/tenant-settings.vo';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    GetTenantSettingsParams,
    IGetTenantSettingsQueryPort,
    TenantSettingsRow,
} from './get-tenant-settings.port';

/**
 * Read-only projection of per-tenant settings (reservation timeouts) plus
 * the raw feature flags. Falls back to TenantSettings.defaults() when the
 * tenant has none configured.
 */
@Injectable()
export class GetTenantSettingsPrismaQuery implements IGetTenantSettingsQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetTenantSettingsParams): Promise<TenantSettingsRow | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: params.tenantId },
            select: { id: true, featureFlags: true },
        });
        if (!tenant) return null;

        const featureFlags = (tenant.featureFlags ?? {}) as Record<string, unknown>;
        const raw = featureFlags?.reservation as
            | { electiveReservationTimeoutInDays?: number; emergencyReservationTimeoutInHours?: number }
            | undefined;
        const settings =
            raw &&
            typeof raw.electiveReservationTimeoutInDays === 'number' &&
            typeof raw.emergencyReservationTimeoutInHours === 'number'
                ? TenantSettings.create(
                    tenant.id,
                    raw.electiveReservationTimeoutInDays,
                    raw.emergencyReservationTimeoutInHours,
                )
                : TenantSettings.defaults(tenant.id);

        return {
            tenantId: tenant.id,
            electiveReservationTimeoutInDays: settings.electiveReservationTimeoutInDays,
            emergencyReservationTimeoutInHours: settings.emergencyReservationTimeoutInHours,
            featureFlags,
        };
    }
}
