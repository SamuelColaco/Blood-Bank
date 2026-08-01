import { z } from 'zod';
import { EquipmentType } from '../../domain/enums/equipment-type.enum';

export const registerEquipmentSchema = z.object({
    tenantId: z.string().uuid(),
    equipmentType: z.nativeEnum(EquipmentType),
    minTemperature: z.number(),
    maxTemperature: z.number(),
});

export type RegisterEquipmentDto = z.infer<typeof registerEquipmentSchema>;
