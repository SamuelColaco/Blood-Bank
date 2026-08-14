import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { TransportTemperatureOutOfRangeDetectedEvent } from '../events/transport-container.events';

/**
 * Mobile cold-chain container used to ship an allocated component to the
 * hospital. Mirrors the Inventory `Equipment` aggregate on purpose but is
 * its own aggregate root: it is bound to a specific delivery (a
 * HospitalRequest), not to a fixed storage location (SDD Fase 3, section 4.2).
 *
 * Like Equipment, temperature readings never mutate this aggregate - a
 * reading outside the safe range raises a domain event and the linked
 * component is reevaluated asynchronously (eventual consistency).
 */
export class TransportContainer extends AggregateRoot<string> {
  private constructor(
    id: string,
    public readonly tenantId: string,
    public readonly linkedHospitalRequestId: string,
    public readonly minTemperature: number,
    public readonly maxTemperature: number,
  ) {
    super(id);
  }

  static start(props: {
    id: string;
    tenantId: string;
    linkedHospitalRequestId: string;
    minTemperature: number;
    maxTemperature: number;
  }): TransportContainer {
    return new TransportContainer(
      props.id,
      props.tenantId,
      props.linkedHospitalRequestId,
      props.minTemperature,
      props.maxTemperature,
    );
  }

  /** Reconstructs from persisted state. Raises no domain events. */
  static restore(props: {
    id: string;
    tenantId: string;
    linkedHospitalRequestId: string;
    minTemperature: number;
    maxTemperature: number;
  }): TransportContainer {
    return new TransportContainer(
      props.id,
      props.tenantId,
      props.linkedHospitalRequestId,
      props.minTemperature,
      props.maxTemperature,
    );
  }

  /** Evaluates a sensor reading. If it leaves the safe range, raises an event for the linked delivery. */
  recordTemperatureReading(value: number): void {
    if (value < this.minTemperature || value > this.maxTemperature) {
      this.addDomainEvent(
        new TransportTemperatureOutOfRangeDetectedEvent(
          this.id,
          this.tenantId,
          this.linkedHospitalRequestId,
          value,
        ),
      );
    }
  }
}
