import { Donor } from '../entities/donor.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface IDonorRepository {
    findById(id: string): Promise<Donor | null>;
    findByDocumentId(tenantId: string, documentId: string): Promise<Donor | null>;
    save(donor: Donor, scope?: ITransactionScope): Promise<void>;
}
