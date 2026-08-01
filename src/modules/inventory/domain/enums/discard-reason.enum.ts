/**
 * Closed set of reasons a component can be discarded. Kept as an enum
 * (not free text) because discard cause feeds directly into waste-
 * reduction metrics discussed in PRODUTO.md.
 */
export enum DiscardReason {
  EXPIRED = 'EXPIRED',
  POSITIVE_SEROLOGY = 'POSITIVE_SEROLOGY',
  PROCESS_FAILURE = 'PROCESS_FAILURE',
  UNUSED_SURGICAL_RESERVATION_EXPIRED = 'UNUSED_SURGICAL_RESERVATION_EXPIRED',
}
