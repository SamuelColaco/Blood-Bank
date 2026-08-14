import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    GetScreeningQueueParams,
    IGetScreeningQueueQueryPort,
    ScreeningQueueRow,
} from './get-screening-queue.port';

/**
 * Screen query: "Fila de Triagem".
 */
@Injectable()
export class GetScreeningQueueQuery {
    constructor(
        @Inject(DonationTokens.GET_SCREENING_QUEUE_QUERY)
        private readonly port: IGetScreeningQueueQueryPort,
    ) { }

    execute(params: GetScreeningQueueParams): Promise<ScreeningQueueRow[]> {
        return this.port.execute(params);
    }
}
