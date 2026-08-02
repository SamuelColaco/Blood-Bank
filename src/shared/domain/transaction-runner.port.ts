/**
 * Abstraction for running a callback inside a single database transaction.
 *
 * Implementations guarantee that every persistence operation performed
 * through the provided ITransactionScope shares the same atomic unit of
 * work - either all writes commit or all roll back together.
 */
export interface ITransactionRunner {
    runInTransaction<T>(callback: (scope: ITransactionScope) => Promise<T>): Promise<T>;
}
