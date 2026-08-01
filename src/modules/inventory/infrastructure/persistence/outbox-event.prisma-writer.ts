import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { IOutboxEventWriter } from '../../application/ports/outbox-event-writer.port';
import { PrismaService } from './prisma.service';

/**
 * Prisma implementation of the transactional outbox writer.
 *
 * NOTE ON THE CURRENT LIMITATION: for this to be a true transactional
 * outbox, `write` must run inside the SAME `prisma.$transaction(...)`
 * block as the aggregate's `save()` call - otherwise a crash between the
 * two writes could lose the audit event. Wiring that shared transaction
 * across use cases is intentionally left for the first real
 * implementation task of Phase 1 (see docs/fase-1.md, "Próximo Passo
 * Prático") rather than solved here with a scaffold that would look
 * finished but silently skip the guarantee it exists to provide.
 */
@Injectable()
export class OutboxEventPrismaWriter implements IOutboxEventWriter {
  constructor(private readonly prisma: PrismaService) { }

  async write(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.prisma.outboxEvent.createMany({
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
