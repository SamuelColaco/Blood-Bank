/**
 * The full lifecycle of a BloodComponent, from separation to its final
 * disposition. Every transition between these statuses is guarded by a
 * business rule inside the BloodComponent aggregate - there is no path
 * that skips a state (e.g. a component can never be reserved directly
 * from IN_QUARANTINE without first being cleared and stored).
 *
 * Note: there is deliberately no "conditionally released" status here.
 * Any exception to standard quarantine release (e.g. releasing platelets
 * before serology results are final) is out of scope by product decision
 * - see docs/fase-1.md, "Escopo fechado".
 */
export enum ComponentStatus {
  SEPARATED = 'SEPARATED',
  IN_QUARANTINE = 'IN_QUARANTINE',
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
  STORED = 'STORED',
  RESERVED = 'RESERVED',
  ALLOCATED = 'ALLOCATED',
  OFFERED_FOR_EXCHANGE = 'OFFERED_FOR_EXCHANGE',
  EXPIRED = 'EXPIRED',
  DISCARDED = 'DISCARDED',
}
