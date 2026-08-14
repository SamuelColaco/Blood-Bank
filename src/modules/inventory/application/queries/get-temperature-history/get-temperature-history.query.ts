import { Inject, Injectable } from '@nestjs/common';
import { TEMPERATURE_HISTORY_QUERY } from '../../tokens';
import {
    GetTemperatureHistoryParams,
    IGetTemperatureHistoryQueryPort,
    TemperatureReadingRow,
} from './get-temperature-history.port';

/**
 * Screen query: Equipamentos - temperature history chart.
 */
@Injectable()
export class GetTemperatureHistoryQuery {
    constructor(
        @Inject(TEMPERATURE_HISTORY_QUERY)
        private readonly port: IGetTemperatureHistoryQueryPort,
    ) { }

    execute(params: GetTemperatureHistoryParams): Promise<TemperatureReadingRow[]> {
        return this.port.execute(params);
    }
}
