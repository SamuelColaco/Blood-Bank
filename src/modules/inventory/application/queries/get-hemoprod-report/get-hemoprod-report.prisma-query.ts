import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    GetHemoprodReportParams,
    HemoprodReportRow,
    IGetHemoprodReportQueryPort,
} from './get-hemoprod-report.port';

/**
 * Read-only projection for the regulatory Hemoprod report: production,
 * discard and expiry tallies per component type in a period.
 */
@Injectable()
export class GetHemoprodReportPrismaQuery implements IGetHemoprodReportQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetHemoprodReportParams): Promise<HemoprodReportRow[]> {
        const to = params.to ?? new Date();
        const from =
            params.from ??
            (params.days !== undefined
                ? new Date(to.getTime() - params.days * 24 * 60 * 60 * 1000)
                : new Date(0));

        const produced = await this.prisma.bloodComponent.groupBy({
            by: ['componentType'],
            where: { tenantId: params.tenantId, collectedAt: { gte: from, lte: to } },
            _count: { _all: true },
        });

        const discardedEvents = await this.prisma.outboxEvent.findMany({
            where: { eventName: 'ComponentDiscarded', occurredAt: { gte: from, lte: to } },
            select: { payload: true, aggregateId: true },
        });
        const discardedByAggregate = new Map<string, number>();
        for (const e of discardedEvents) {
            discardedByAggregate.set(e.aggregateId, (discardedByAggregate.get(e.aggregateId) ?? 0) + 1);
        }
        const discardedComponents = await this.prisma.bloodComponent.findMany({
            where: { tenantId: params.tenantId, id: { in: [...discardedByAggregate.keys()] } },
            select: { id: true, componentType: true },
        });

        const expired = await this.prisma.bloodComponent.groupBy({
            by: ['componentType'],
            where: { tenantId: params.tenantId, status: 'EXPIRED' },
            _count: { _all: true },
        });

        const producedMap = new Map<string, number>(produced.map((r) => [String(r.componentType), r._count._all]));
        const expiredMap = new Map<string, number>(expired.map((r) => [String(r.componentType), r._count._all]));
        const discardedMap = new Map<string, number>();
        for (const c of discardedComponents) {
            discardedMap.set(c.componentType, (discardedMap.get(c.componentType) ?? 0) + 1);
        }

        const types = new Set([
            ...producedMap.keys(),
            ...expiredMap.keys(),
            ...discardedMap.keys(),
        ]);

        return [...types].map((componentType) => ({
            componentType,
            produced: producedMap.get(componentType) ?? 0,
            discarded: discardedMap.get(componentType) ?? 0,
            expired: expiredMap.get(componentType) ?? 0,
        }));
    }
}
