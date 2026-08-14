import { Hospital } from '../entities/hospital.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

/**
 * Port for the partner-hospital directory of the Distribuição bounded
 * context. Hospitals are reference data validated at the request boundary,
 * not an aggregate root - this port only needs to read them for validation
 * and persist new ones from the registration use case.
 */
export interface IHospitalRepository {
  findById(id: string): Promise<Hospital | null>;
  save(hospital: Hospital, scope?: ITransactionScope): Promise<void>;
}
