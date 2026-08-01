/**
 * Opaque handle representing a shared database transaction context.
 *
 * This interface has NO Prisma-specific members on purpose: the domain
 * and application layers must stay persistence-agnostic. Concrete
 * implementations (e.g. PrismaTransactionScope) live in infrastructure
 * and are never imported outside of it.
 */
export interface ITransactionScope {
    /** Unique identifier for this transaction scope, used for logging/debugging. */
    readonly transactionId: string;
}