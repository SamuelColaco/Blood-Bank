/**
 * The full lifecycle of a HospitalRequest. Every transition is guarded
 * inside the HospitalRequest aggregate - SDD Fase 3, section 4.1:
 *
 *   REQUESTED -> MATCHED -> RESERVED -> CROSSMATCH_CONFIRMED -> ALLOCATED -> DELIVERED
 *                                                                    -> CANCELLED (any point before ALLOCATED)
 *                     -> REJECTED (no compatible component available)
 */
export enum HospitalRequestStatus {
  REQUESTED = 'REQUESTED',
  MATCHED = 'MATCHED',
  RESERVED = 'RESERVED',
  CROSSMATCH_CONFIRMED = 'CROSSMATCH_CONFIRMED',
  ALLOCATED = 'ALLOCATED',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
