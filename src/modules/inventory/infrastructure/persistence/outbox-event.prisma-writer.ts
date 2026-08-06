import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { IOutboxEventWriter } from '../../application/ports/outbox-event-writer.port';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { PrismaService } from './prisma.service';
import { PrismaTransactionRunner } from './prisma-transaction-runner';

/**
 * Prisma implementation of the transactional outbox writer.
 *
 * When a scope is provided, writes use the Prisma transaction client
 * associated with that scope - guaranteeing the outbox row lands in
 * the exact same atomic unit as the aggregate state change. When no
 * scope is provided, falls back to standalone writes (used only by
 * TemperatureOutOfRangeHandler, which does not participate in a
 * use-case-level transaction by design).
 */
@Injectable()
export class OutboxEventPrismaWriter implements IOutboxEventWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
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
