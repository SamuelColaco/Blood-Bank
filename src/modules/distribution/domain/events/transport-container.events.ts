import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * Raised when a TransportContainer detects a temperature reading outside
 * its safe range while in transit. Consumed asynchronously by a handler
 * that reevaluates the component linked to that delivery - mirroring the
 * eventually-consistent cold-chain reaction validated in Fase 1 (SDD Fase 3,
 * section 4.2). The container never mutates components directly.
 */
export class TransportTemperatureOutOfRangeDetectedEvent extends DomainEvent {
  readonly eventName = 'TransportTemperatureOutOfRangeDetected';
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly hospitalRequestId: string,
    public readonly reading: number,
  ) {
    super();
  }
}
