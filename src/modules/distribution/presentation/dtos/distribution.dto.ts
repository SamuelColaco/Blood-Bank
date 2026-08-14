import { z } from 'zod';
import { AboGroup, RhFactor } from '../../../../shared/domain/blood-type.vo';
import { Urgency } from '../../domain/enums/urgency.enum';

const bloodTypeSchema = z.object({
  aboGroup: z.nativeEnum(AboGroup),
  rhFactor: z.nativeEnum(RhFactor),
  extendedPhenotype: z.string().optional(),
});

const specialProcessingSchema = z.object({
  isIrradiated: z.boolean().optional().default(false),
  isLeukoreduced: z.boolean().optional().default(false),
});

export const registerHospitalSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export const requestComponentSchema = z.object({
  tenantId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  requestedBloodType: bloodTypeSchema,
  requiredSpecialProcessing: specialProcessingSchema.optional(),
  urgency: z.nativeEnum(Urgency),
});

export const confirmCrossmatchSchema = z.object({
  crossmatchReference: z.string().min(1),
  confirmedBy: z.string().min(1),
  role: z.string().min(1),
});

export const overridePickSchema = z.object({
  chosenComponentId: z.string().uuid(),
  reason: z.string().optional(),
});

export const startTransportSchema = z.object({
  minTemperature: z.number(),
  maxTemperature: z.number(),
});

export const transportReadingSchema = z.object({ value: z.number() });

export const cancelRequestSchema = z.object({ reason: z.string().min(1) });
