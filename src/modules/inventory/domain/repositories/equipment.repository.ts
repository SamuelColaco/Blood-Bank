import { Equipment } from '../entities/equipment.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface IEquipmentRepository {
  findById(id: string): Promise<Equipment | null>;
  save(equipment: Equipment, scope?: ITransactionScope): Promise<void>;

}
