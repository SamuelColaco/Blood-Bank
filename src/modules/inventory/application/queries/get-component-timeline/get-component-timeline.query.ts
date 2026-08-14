import { Inject, Injectable } from '@nestjs/common';
import { COMPONENT_TIMELINE_QUERY } from '../../tokens';
import {
    ComponentTimelineEventRow,
    GetComponentTimelineParams,
    IGetComponentTimelineQueryPort,
} from './get-component-timeline.port';

/**
 * Screen query: Detalhe do Componente - audit/timeline events.
 */
@Injectable()
export class GetComponentTimelineQuery {
    constructor(
        @Inject(COMPONENT_TIMELINE_QUERY)
        private readonly port: IGetComponentTimelineQueryPort,
    ) { }

    execute(params: GetComponentTimelineParams): Promise<ComponentTimelineEventRow[]> {
        return this.port.execute(params);
    }
}
