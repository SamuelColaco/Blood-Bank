import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { IOutboxEventWriter } from '../../../../shared/domain/ports/outbox-event-writer.port';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { DonationPrismaService } from './donation-prisma.service';
import { DonationPrismaTransactionRunner } from './transaction-runner';

/**
 * Prisma-backed implementation of IOutboxEventWriter for Donation context.
 *
 * Writes domain events to the outbox table in the SAME transaction as the
 * aggregate state change - this is the transactional outbox pattern that
 * guarantees no event is lost if the process crashes mid-write.
 */
@Injectable()
export class DonationOutboxEventWriter implements IOutboxEventWriter {
    constructor(
        private readonly prisma: DonationPrismaService,
        private readonly transactionRunner: DonationPrismaTransactionRunner,
    ) { }

    async write(events: DomainEvent[], scope?: ITransactionScope): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const client = scope
            ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
            : this.prisma;

        await client.outboxEvent.createMany({
            data: events.map((event) => ({
                id: randomUUID(),
                aggregateId: event.aggregateId,
                aggregateType: event.constructor.name,
                eventName: event.eventName,
                payload: JSON.parse(JSON.stringify(event)),
                occurredAt: event.occurredAt,
            })),
        });
    }
}
