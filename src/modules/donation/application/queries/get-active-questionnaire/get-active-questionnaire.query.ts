import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    ActiveQuestionnaireRow,
    GetActiveQuestionnaireParams,
    IGetActiveQuestionnaireQueryPort,
} from './get-active-questionnaire.port';

/**
 * Screen query: active clinical questionnaire version.
 */
@Injectable()
export class GetActiveQuestionnaireQuery {
    constructor(
        @Inject(DonationTokens.GET_ACTIVE_QUESTIONNAIRE_QUERY)
        private readonly port: IGetActiveQuestionnaireQueryPort,
    ) { }

    execute(params: GetActiveQuestionnaireParams): Promise<ActiveQuestionnaireRow | null> {
        return this.port.execute(params);
    }
}
