/**
 * Read model for the "Detalhe do Componente" timeline/audit
 * (GET /inventory/blood-components/:id/events). The events recorded in the
 * outbox/audit trail for that aggregate, oldest first.
 */
export interface ComponentTimelineEventRow {
    eventName: string;
    occurredAt: Date;
    payload: Record<string, unknown>;
}

export interface GetComponentTimelineParams {
    aggregateId: string;
}

export interface IGetComponentTimelineQueryPort {
    execute(params: GetComponentTimelineParams): Promise<ComponentTimelineEventRow[]>;
}
