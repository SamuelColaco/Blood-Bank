import { Injectable } from '@nestjs/common';
import { TenantSettings } from '../../domain/value-objects/tenant-settings.vo';
import { ITenantSettingsRepository } from '../../domain/repositories/tenant-settings.repository';
import { PrismaService } from './prisma.service';
import { z } from 'zod';

const reservationSettingsSchema = z.object({
    electiveReservationTimeoutInDays: z.number().int().positive(),
    emergencyReservationTimeoutInHours: z.number().int().positive(),
});

/**
 * Reads per-tenant reservation timeout settings from Tenant.featureFlags.
 *
 * Falls back to TenantSettings.defaults() when the tenant has no settings
 * or the stored JSON is malformed/incomplete - the application layer never
 * has to deal with missing data.
 */
@Injectable()
export class TenantSettingsPrismaRepository implements ITenantSettingsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByTenantId(tenantId: string): Promise<TenantSettings | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { featureFlags: true },
        });

        if (!tenant) {
            return null;
        }

        const featureFlags = tenant.featureFlags as Record<string, unknown> | null;
        const raw = featureFlags?.reservation;

        if (!raw || typeof raw !== 'object') {
            return TenantSettings.defaults(tenantId);
        }

        const parsed = reservationSettingsSchema.safeParse(raw);
        if (!parsed.success) {
            return TenantSettings.defaults(tenantId);
        }

        return TenantSettings.create(
            tenantId,
            parsed.data.electiveReservationTimeoutInDays,
            parsed.data.emergencyReservationTimeoutInHours,
        );
    }
}
