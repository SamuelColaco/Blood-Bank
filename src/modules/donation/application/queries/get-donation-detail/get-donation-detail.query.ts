import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    DonationDetailRow,
    GetDonationDetailParams,
    IGetDonationDetailQueryPort,
} from './get-donation-detail.port';

/**
 * Screen query: single-donation snapshot (Sinais Vitais / Decisão de
 * Aptidão / Finalizar Coleta).
 */
@Injectable()
export class GetDonationDetailQuery {
    constructor(
        @Inject(DonationTokens.GET_DONATION_DETAIL_QUERY)
        private readonly port: IGetDonationDetailQueryPort,
    ) { }

    execute(params: GetDonationDetailParams): Promise<DonationDetailRow | null> {
        return this.port.execute(params);
    }
}
