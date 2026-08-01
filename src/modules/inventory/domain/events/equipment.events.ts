import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * Raised when Equipment detects a temperature reading outside its safe
 * range. Every BloodComponent currently stored in this equipment reacts
 * to this asynchronously (via the outbox worker), flagging itself for
 * reevaluation - this event never triggers a direct write across
 * aggregates. See docs/fase-1.md, section 2, for why.
 */
export class TemperatureOutOfRangeDetectedEvent extends DomainEvent {
  readonly eventName = 'TemperatureOutOfRangeDetected';
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly reading: number,
  ) {
    super();
  }
}
