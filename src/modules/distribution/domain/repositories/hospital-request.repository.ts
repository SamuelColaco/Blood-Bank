import { HospitalRequest } from '../entities/hospital-request.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface IHospitalRequestRepository {
  findById(id: string): Promise<HospitalRequest | null>;
  findByIdForUpdate(id: string, scope?: ITransactionScope): Promise<HospitalRequest | null>;
  save(request: HospitalRequest, scope?: ITransactionScope): Promise<void>;
}
