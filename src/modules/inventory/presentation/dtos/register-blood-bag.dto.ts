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
});

export type RegisterBloodBagDto = z.infer<typeof registerBloodBagSchema>;
