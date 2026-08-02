import { ClinicalQuestionnaireVersion } from '../entities/clinical-questionnaire-version.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface IClinicalQuestionnaireVersionRepository {
    findById(id: string): Promise<ClinicalQuestionnaireVersion | null>;
    findActiveByTenantId(tenantId: string): Promise<ClinicalQuestionnaireVersion | null>;
    save(version: ClinicalQuestionnaireVersion, scope?: ITransactionScope): Promise<void>;
}
