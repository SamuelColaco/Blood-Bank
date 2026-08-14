import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    ISearchDonorsQueryPort,
    SearchDonorRow,
    SearchDonorsParams,
} from './search-donors.port';

/**
 * Screen query: "Busca de Doador". Thin delegate - the Prisma implementation
 * lives behind ISearchDonorsQueryPort so this class never talks to the DB.
 */
@Injectable()
export class SearchDonorsQuery {
    constructor(
        @Inject(DonationTokens.SEARCH_DONORS_QUERY)
        private readonly port: ISearchDonorsQueryPort,
    ) { }

    execute(params: SearchDonorsParams): Promise<SearchDonorRow[]> {
        return this.port.execute(params);
    }
}
