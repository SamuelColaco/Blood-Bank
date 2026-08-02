import { z } from 'zod';

/**
 * Input contract for POST /inventory/blood-bags, validated with zod
 * before it ever reaches the use case. Keeping validation here (not in
 * the domain) means the domain layer only ever sees already-well-formed
 * primitives.
 */
export const registerBloodBagSchema = z.object({
  tenantId: z.string().uuid(),
  donationId: z.string().uuid(),
  collectedAt: z.coerce.date(),
  donationPurpose: z.enum(['GENERAL', 'AUTOLOGOUS', 'DIRECTED']),
  designatedRecipientId: z.string().uuid().optional(),
});

export type RegisterBloodBagDto = z.infer<typeof registerBloodBagSchema>;
