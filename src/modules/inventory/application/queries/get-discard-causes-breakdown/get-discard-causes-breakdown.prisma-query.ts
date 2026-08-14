import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    DiscardCauseRow,
    IGetDiscardCausesBreakdownQueryPort,
    PeriodFilter,
} from './get-discard-causes-breakdown.port';

/** Event name for a component discard, as persisted in the outbox. */
const COMPONENT_DISCARDED_EVENT = 'ComponentDiscarded';

/**
 * Read-only projection counting discarded components by DiscardReason.
 * Read from the outbox/audit trail because the component row itself does
 * not persist a discard-reason column - the payload carries it.
 */
@Injectable()
export class GetDiscardCausesBreakdownPrismaQuery implements IGetDiscardCausesBreakdownQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: PeriodFilter): Promise<DiscardCauseRow[]> {
        const range = this.range(params);
        const events = await this.prisma.outboxEvent.findMany({
            where: {
                eventName: COMPONENT_DISCARDED_EVENT,
                occurredAt: { gte: range.from, lte: range.to },
            },
            select: { payload: true },
        });

        const counts = new Map<string, number>();
        for (const event of events) {
            const reason = (event.payload as { reason?: string } | null)?.reason ?? 'UNKNOWN';
            counts.set(reason, (counts.get(reason) ?? 0) + 1);
        }

        return [...counts.entries()]
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);
    }

    /** Resolves days vs explicit range into a {from,to} window. */
    protected range(params: PeriodFilter): { from: Date; to: Date } {
        const to = params.to ?? new Date();
        const from =
            params.from ??
            (params.days !== undefined
                ? new Date(to.getTime() - params.days * 24 * 60 * 60 * 1000)
                : new Date(0));
        return { from, to };
    }
}
