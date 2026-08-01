import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { ITransactionScope } from '../../domain/ports/transaction-scope.port';

/**
 * Port for persisting domain events to the transactional outbox.
 *
 * The concrete implementation MUST write to the exact same database
 * transaction used to persist the aggregate's state change - that is
 * what guarantees the audit trail is never lost, without adding a
 * synchronous network call to the request/response cycle. A separate,
 * asynchronous worker later reads this table and writes to the
 * append-only audit_logs table. See docs/fase-1.md, section 3.
 */
export interface IOutboxEventWriter {
  write(events: DomainEvent[], scope?: ITransactionScope): Promise<void>;
}
