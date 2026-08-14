import { Inject, Injectable } from '@nestjs/common';
import { HEMOPROD_REPORT_QUERY } from '../../tokens';
import {
    GetHemoprodReportParams,
    HemoprodReportRow,
    IGetHemoprodReportQueryPort,
} from './get-hemoprod-report.port';

/**
 * Screen query: RelatÃ³rios - Hemoprod.
 */
@Injectable()
export class GetHemoprodReportQuery {
    constructor(
        @Inject(HEMOPROD_REPORT_QUERY)
        private readonly port: IGetHemoprodReportQueryPort,
    ) { }

    execute(params: GetHemoprodReportParams): Promise<HemoprodReportRow[]> {
        return this.port.execute(params);
    }
}
