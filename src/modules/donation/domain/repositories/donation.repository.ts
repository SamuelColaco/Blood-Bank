import { Donation } from '../entities/donation.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface IDonationRepository {
    findById(id: string): Promise<Donation | null>;
    findByDonorId(tenantId: string, donorId: string): Promise<Donation[]>;
    save(donation: Donation, scope?: ITransactionScope): Promise<void>;
}
