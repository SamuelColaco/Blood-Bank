import { DomainEvent } from './domain-event.base';

/**
 * Base class for aggregate roots.
 *
 * An aggregate root is the only entry point through which its aggregate
 * can be loaded and modified — it is responsible for enforcing every
 * invariant of the objects it owns. This base class also collects the
 * domain events raised while a use case runs, so the application layer
 * can persist them to the outbox in the same transaction that changes
 * the aggregate's state (see docs/fase-1.md, section 3).
 */
export abstract class AggregateRoot<Id> {
  private readonly domainEvents: DomainEvent[] = [];

  protected constructor(public readonly id: Id) { }

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Returns every domain event raised so far and clears the internal
   * list. Call this exactly once, right before persisting the aggregate.
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
