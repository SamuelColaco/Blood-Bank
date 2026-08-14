import { Inject, Injectable } from '@nestjs/common';
import { NEAR_EXPIRY_COMPONENTS_QUERY } from '../../tokens';
import {
    GetNearExpiryComponentsParams,
    IGetNearExpiryComponentsQueryPort,
    NearExpiryComponentRow,
} from './get-near-expiry-components.port';

/**
 * Screen query: Dashboard de Estoque - near expiry list.
 */
@Injectable()
export class GetNearExpiryComponentsQuery {
    constructor(
        @Inject(NEAR_EXPIRY_COMPONENTS_QUERY)
        private readonly port: IGetNearExpiryComponentsQueryPort,
    ) { }

    execute(params: GetNearExpiryComponentsParams): Promise<NearExpiryComponentRow[]> {
        return this.port.execute(params);
    }
}
