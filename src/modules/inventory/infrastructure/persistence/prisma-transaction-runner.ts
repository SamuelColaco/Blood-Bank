import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import { ITransactionRunner } from '../../application/ports/transaction-runner.port';
import { ITransactionScope } from '../../application/ports/transaction-scope.port';
import { randomUUID } from 'crypto';

/**
 * Prisma-backed implementation of ITransactionRunner.
 *
 * Maintains a map of active transaction clients keyed by transactionId.
 * When a scope is provided to repository/outbox methods, they look up
 * the corresponding Prisma transaction client here and use it for the
 * actual query - guaranteeing all writes share the same atomic unit.
 */
@Injectable()
export class PrismaTransactionRunner implements ITransactionRunner {
    private readonly activeTransactions = new Map<string, Prisma.TransactionClient>();

    constructor(private readonly prisma: PrismaService) { }

    async runInTransaction<T>(callback: (scope: ITransactionScope) => Promise<T>): Promise<T> {
        const transactionId = randomUUID();
        const scope: ITransactionScope = { transactionId };

        return this.prisma.$transaction(async (tx) => {
            this.activeTransactions.set(transactionId, tx);
            try {
                return await callback(scope);
            } finally {
                this.activeTransactions.delete(transactionId);
            }
        });
    }

    /**
     * Returns the Prisma transaction client associated with the given scope,
     * or undefined if the scope is not part of an active transaction.
     */
    getTransactionClient(scope: ITransactionScope): Prisma.TransactionClient | undefined {
        return this.activeTransactions.get(scope.transactionId);
    }
}