/**
 * Opaque handle representing a shared database transaction context.
 *
 */
export interface ITransactionScope {
    /** Unique identifier for this transaction scope, used for logging/debugging. */
    readonly transactionId: string;
}