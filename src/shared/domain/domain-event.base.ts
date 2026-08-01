/**
 * Base class for all domain events in the system.
 *
 * A domain event represents something meaningful that happened to an
 * aggregate. Events are raised by aggregates during a use case and are
 * later written to the transactional outbox by the application layer -
 * never published directly to the outside world by the domain itself.
 */
export abstract class DomainEvent {
  /** When the event was raised, not when it was persisted or processed. */
  readonly occurredAt: Date = new Date();

  /** Unique name used for routing/processing in the outbox worker. */
  abstract readonly eventName: string;

  /** ID of the aggregate that raised this event. */
  abstract readonly aggregateId: string;
}
