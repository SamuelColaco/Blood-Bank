import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    DonorDetailRow,
    GetDonorDetailParams,
    IGetDonorDetailQueryPort,
} from './get-donor-detail.port';

/**
 * Screen query: "Ficha do Doador".
 */
@Injectable()
export class GetDonorDetailQuery {
    constructor(
        @Inject(DonationTokens.GET_DONOR_DETAIL_QUERY)
        private readonly port: IGetDonorDetailQueryPort,
    ) { }

    execute(params: GetDonorDetailParams): Promise<DonorDetailRow | null> {
        return this.port.execute(params);
    }
}
