import { Inject, Injectable } from '@nestjs/common';
import { DISCARD_CAUSES_BREAKDOWN_QUERY } from '../../tokens';
import {
    DiscardCauseRow,
    IGetDiscardCausesBreakdownQueryPort,
    PeriodFilter,
} from './get-discard-causes-breakdown.port';

/**
 * Screen query: Dashboard de Estoque - discard causes breakdown.
 */
@Injectable()
export class GetDiscardCausesBreakdownQuery {
    constructor(
        @Inject(DISCARD_CAUSES_BREAKDOWN_QUERY)
        private readonly port: IGetDiscardCausesBreakdownQueryPort,
    ) { }

    execute(params: PeriodFilter): Promise<DiscardCauseRow[]> {
        return this.port.execute(params);
    }
}
