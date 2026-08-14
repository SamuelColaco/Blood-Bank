import type { Question } from '../../../domain/entities/clinical-questionnaire-version.entity';

/**
 * Read model for the "Configuração do Questionário" screen
 * (GET /donation/questionnaire-versions). Lists all published versions,
 * newest first.
 */
export interface QuestionnaireVersionRow {
    id: string;
    versionNumber: number;
    publishedAt: Date;
    publishedBy: string;
    questions: Question[];
}

export interface GetQuestionnaireVersionsParams {
    tenantId: string;
}

export interface IGetQuestionnaireVersionsQueryPort {
    execute(params: GetQuestionnaireVersionsParams): Promise<QuestionnaireVersionRow[]>;
}
