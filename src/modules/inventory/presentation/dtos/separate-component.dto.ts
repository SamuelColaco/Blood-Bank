import { z } from 'zod';
import { ComponentType } from '../../domain/enums/component-type.enum';
import { AboGroup, RhFactor } from '../../domain/value-objects/blood-type.vo';

const componentToSeparateSchema = z.object({
  componentType: z.nativeEnum(ComponentType),
  aboGroup: z.nativeEnum(AboGroup),
  rhFactor: z.nativeEnum(RhFactor),
  extendedPhenotype: z.string().optional(),
});

export const separateComponentSchema = z.object({
  bloodBagId: z.string().uuid(),
  separatedAt: z.coerce.date(),
  components: z.array(componentToSeparateSchema).min(1),
});

export type SeparateComponentDto = z.infer<typeof separateComponentSchema>;
