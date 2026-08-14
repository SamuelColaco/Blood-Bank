import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    ApprovedDonationRow,
    GetApprovedDonationsParams,
    IGetApprovedDonationsQueryPort,
} from './get-approved-donations.port';

/**
 * Screen query: donations approved and awaiting collection.
 */
@Injectable()
export class GetApprovedDonationsQuery {
    constructor(
        @Inject(DonationTokens.GET_APPROVED_DONATIONS_QUERY)
        private readonly port: IGetApprovedDonationsQueryPort,
    ) { }

    execute(params: GetApprovedDonationsParams): Promise<ApprovedDonationRow[]> {
        return this.port.execute(params);
    }
}
