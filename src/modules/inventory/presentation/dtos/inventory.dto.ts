import { z } from 'zod';

/**
 * Input contracts for the Inventory write endpoints, validated with zod
 * before they reach a use case. The DTOs for the existing write routes
 * live in their own files (register-blood-bag, register-equipment,
 * separate-component) - this file covers the endpoints added to close the
 * gaps from SDD "Endpoints de API Faltando" §2.2.
 */

export const recordTemperatureReadingSchema = z.object({
    value: z.number(),
});

export const updateTenantSettingsSchema = z.object({
    electiveReservationTimeoutInDays: z.number().int().positive(),
    emergencyReservationTimeoutInHours: z.number().int().positive(),
});

export type RecordTemperatureReadingDto = z.infer<typeof recordTemperatureReadingSchema>;
export type UpdateTenantSettingsDto = z.infer<typeof updateTenantSettingsSchema>;
