import { Injectable } from '@nestjs/common';
import { ITenantSettingsWriter, TenantSettingsInput } from '../../application/ports/tenant-settings-writer.port';
import { PrismaService } from './prisma.service';

/**
 * Persists per-tenant reservation settings into Tenant.featureFlags,
 * preserving any pre-existing flags.
 */
@Injectable()
export class TenantSettingsPrismaWriter implements ITenantSettingsWriter {
    constructor(private readonly prisma: PrismaService) { }

    async update(tenantId: string, settings: TenantSettingsInput): Promise<void> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { featureFlags: true },
        });
        if (!tenant) {
            throw new Error(`Tenant ${tenantId} was not found.`);
        }

        const featureFlags = (tenant.featureFlags ?? {}) as Record<string, unknown>;

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                featureFlags: {
                    ...featureFlags,
                    reservation: {
                        electiveReservationTimeoutInDays: settings.electiveReservationTimeoutInDays,
                        emergencyReservationTimeoutInHours: settings.emergencyReservationTimeoutInHours,
                    },
                },
            },
        });
    }
}
