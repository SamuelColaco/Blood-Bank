import { BloodBag } from '../entities/blood-bag.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

/**
 * Port (interface) for persisting and retrieving BloodBag aggregates.
 * The domain layer only depends on this abstraction - concrete
 * implementations (e.g. Prisma) live in infrastructure/persistence.
 */
export interface IBloodBagRepository {
  findById(id: string): Promise<BloodBag | null>;
  save(bloodBag: BloodBag, scope?: ITransactionScope): Promise<void>;
}