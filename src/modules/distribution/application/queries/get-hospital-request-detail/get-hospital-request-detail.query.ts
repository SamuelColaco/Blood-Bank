import { Inject, Injectable } from '@nestjs/common';
import { HOSPITAL_REQUEST_DETAIL_QUERY } from '../../tokens';
import {
    GetHospitalRequestDetailParams,
    HospitalRequestDetailRow,
    IGetHospitalRequestDetailQueryPort,
} from './get-hospital-request-detail.port';

/**
 * Screen query: hospital request detail.
 */
@Injectable()
export class GetHospitalRequestDetailQuery {
    constructor(
        @Inject(HOSPITAL_REQUEST_DETAIL_QUERY)
        private readonly port: IGetHospitalRequestDetailQueryPort,
    ) { }

    execute(params: GetHospitalRequestDetailParams): Promise<HospitalRequestDetailRow | null> {
        return this.port.execute(params);
    }
}
