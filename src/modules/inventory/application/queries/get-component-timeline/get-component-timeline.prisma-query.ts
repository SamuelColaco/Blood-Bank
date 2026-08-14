import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    ComponentTimelineEventRow,
    GetComponentTimelineParams,
    IGetComponentTimelineQueryPort,
} from './get-component-timeline.port';

/**
 * Read-only projection of a component's outbox/audit events (oldest first).
 */
@Injectable()
export class GetComponentTimelinePrismaQuery implements IGetComponentTimelineQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetComponentTimelineParams): Promise<ComponentTimelineEventRow[]> {
        const events = await this.prisma.outboxEvent.findMany({
            where: { aggregateId: params.aggregateId },
            orderBy: { occurredAt: 'asc' },
        });

        return events.map((event) => ({
            eventName: event.eventName,
            occurredAt: event.occurredAt,
            payload: event.payload as Record<string, unknown>,
        }));
    }
}
