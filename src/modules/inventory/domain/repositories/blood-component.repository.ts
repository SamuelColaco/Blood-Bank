import { BloodComponent } from '../entities/blood-component.entity';
import { ITransactionScope } from '../ports/transaction-scope.port';

/**
 * Port (interface) for persisting and retrieving BloodComponent
 * aggregates - the main transactional unit of the Inventory bounded context.
 */
export interface IBloodComponentRepository {
  findById(id: string): Promise<BloodComponent | null>;
  save(component: BloodComponent, scope?: ITransactionScope): Promise<void>;

  /**
   * Used by the temperature-breach policy to find every component
   * currently stored in a given piece of equipment, so each can be
   * flagged for reevaluation independently.
   */
  findStoredInEquipment(equipmentId: string): Promise<BloodComponent[]>;
}
