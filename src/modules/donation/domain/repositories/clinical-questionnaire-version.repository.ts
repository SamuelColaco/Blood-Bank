import { ClinicalQuestionnaireVersion } from '../entities/clinical-questionnaire-version.entity';

export interface IClinicalQuestionnaireVersionRepository {
    findById(id: string): Promise<ClinicalQuestionnaireVersion | null>;
    findActiveByTenantId(tenantId: string): Promise<ClinicalQuestionnaireVersion | null>;
    save(version: ClinicalQuestionnaireVersion): Promise<void>;
}
