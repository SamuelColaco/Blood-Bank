import { Inject, Injectable } from '@nestjs/common';
import { STOCK_SUMMARY_QUERY } from '../../tokens';
import {
    GetStockSummaryParams,
    IGetStockSummaryQueryPort,
    StockSummaryRow,
} from './get-stock-summary.port';

/**
 * Screen query: Dashboard de Estoque - stock summary.
 */
@Injectable()
export class GetStockSummaryQuery {
    constructor(
        @Inject(STOCK_SUMMARY_QUERY) private readonly port: IGetStockSummaryQueryPort,
    ) { }

    execute(params: GetStockSummaryParams): Promise<StockSummaryRow[]> {
        return this.port.execute(params);
    }
}
