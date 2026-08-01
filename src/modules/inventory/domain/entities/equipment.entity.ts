import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { EquipmentType } from '../enums/equipment-type.enum';
import { TemperatureOutOfRangeDetectedEvent } from '../events/equipment.events';

/**
 * Aggregate root representing a piece of storage equipment (freezer,
 * refrigerator, or platelet agitator).
 *
 * Temperature readings are stored separately (see TemperatureReading in
 * prisma/schema.prisma) instead of on this aggregate or on BloodComponent,
 * to avoid turning every sensor reading into a write against every
 * component stored inside - see docs/fase-1.md for the full reasoning.
 * This aggregate only decides whether a reading is a breach and raises an
 * event; it never reaches into BloodComponent directly.
 */
export class Equipment extends AggregateRoot<string> {
  private constructor(
    id: string,
    public readonly tenantId: string,
    public readonly equipmentType: EquipmentType,
    public readonly minTemperature: number,
    public readonly maxTemperature: number,
  ) {
    super(id);
  }

  static register(props: {
    id: string;
    tenantId: string;
    equipmentType: EquipmentType;
    minTemperature: number;
    maxTemperature: number;
  }): Equipment {
    return new Equipment(
      props.id,
      props.tenantId,
      props.equipmentType,
      props.minTemperature,
      props.maxTemperature,
    );
  }

  /** Reconstructs Equipment from persisted state. Raises no domain events. */
  static restore(props: {
    id: string;
    tenantId: string;
    equipmentType: EquipmentType;
    minTemperature: number;
    maxTemperature: number;
  }): Equipment {
    return new Equipment(
      props.id,
      props.tenantId,
      props.equipmentType,
      props.minTemperature,
      props.maxTemperature,
    );
  }

  /**
   * Evaluates a new temperature reading. If it falls outside the safe
   * range, raises a domain event so that every BloodComponent currently
   * stored here can flag itself for reevaluation asynchronously - this
   * aggregate never touches BloodComponent rows directly (consistency is
   * eventual by design, not transactional; see docs/fase-1.md).
   */
  recordTemperatureReading(value: number): void {
    if (value < this.minTemperature || value > this.maxTemperature) {
      this.addDomainEvent(
        new TemperatureOutOfRangeDetectedEvent(this.id, this.tenantId, value),
      );
    }
  }
}
