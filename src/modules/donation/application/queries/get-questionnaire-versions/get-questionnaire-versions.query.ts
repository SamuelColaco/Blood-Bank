import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    GetQuestionnaireVersionsParams,
    IGetQuestionnaireVersionsQueryPort,
    QuestionnaireVersionRow,
} from './get-questionnaire-versions.port';

/**
 * Screen query: published questionnaire versions list.
 */
@Injectable()
export class GetQuestionnaireVersionsQuery {
    constructor(
        @Inject(DonationTokens.GET_QUESTIONNAIRE_VERSIONS_QUERY)
        private readonly port: IGetQuestionnaireVersionsQueryPort,
    ) { }

    execute(params: GetQuestionnaireVersionsParams): Promise<QuestionnaireVersionRow[]> {
        return this.port.execute(params);
    }
}
