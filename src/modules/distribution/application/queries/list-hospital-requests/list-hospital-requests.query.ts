import { Inject, Injectable } from '@nestjs/common';
import { LIST_HOSPITAL_REQUESTS_QUERY } from '../../tokens';
import {
    IListHospitalRequestsQueryPort,
    ListHospitalRequestsParams,
    ListHospitalRequestsResult,
} from './list-hospital-requests.port';

/**
 * Screen query: hospital requests history (paginated).
 */
@Injectable()
export class ListHospitalRequestsQuery {
    constructor(
        @Inject(LIST_HOSPITAL_REQUESTS_QUERY)
        private readonly port: IListHospitalRequestsQueryPort,
    ) { }

    execute(params: ListHospitalRequestsParams): Promise<ListHospitalRequestsResult> {
        return this.port.execute(params);
    }
}
