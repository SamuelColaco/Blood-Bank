import type { Question } from '../../../domain/entities/clinical-questionnaire-version.entity';

/**
 * Read model for the Questionário Clínico screen
 * (GET /donation/questionnaire-versions/active). The currently active
 * (most recently published) questionnaire version with its questions.
 */
export interface ActiveQuestionnaireRow {
    id: string;
    versionNumber: number;
    publishedAt: Date;
    publishedBy: string;
    questions: Question[];
}

export interface GetActiveQuestionnaireParams {
    tenantId: string;
}

export interface IGetActiveQuestionnaireQueryPort {
    execute(params: GetActiveQuestionnaireParams): Promise<ActiveQuestionnaireRow | null>;
}
