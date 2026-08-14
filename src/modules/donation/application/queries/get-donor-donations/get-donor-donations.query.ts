import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    DonorDonationRow,
    GetDonorDonationsParams,
    IGetDonorDonationsQueryPort,
} from './get-donor-donations.port';

/**
 * Screen query: "Histórico de Doações".
 */
@Injectable()
export class GetDonorDonationsQuery {
    constructor(
        @Inject(DonationTokens.GET_DONOR_DONATIONS_QUERY)
        private readonly port: IGetDonorDonationsQueryPort,
    ) { }

    execute(params: GetDonorDonationsParams): Promise<DonorDonationRow[]> {
        return this.port.execute(params);
    }
}
