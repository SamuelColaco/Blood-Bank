import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { Reservation, ReservationKind } from '../../../domain/value-objects/reservation.vo';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER } from '../../tokens';

/**
 * Default reservation timeouts (see DECISOES-HOTSPOTS.md). These should
 * become per-tenant configuration before Phase 3 (Distribution) - hardcoded
 * here only because Phase 1 has no tenant configuration mechanism yet.
 */
const ELECTIVE_RESERVATION_TIMEOUT_DAYS = 3;
const EMERGENCY_RESERVATION_TIMEOUT_HOURS = 2;

export interface ReserveComponentInput {
  componentId: string;
  requestedBy: string;
  kind: ReservationKind;
}

/** Use case: reserves an available component for a hospital request. */
@Injectable()
export class ReserveComponentUseCase {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) {}

  async execute(input: ReserveComponentInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    const reservation =
      input.kind === 'ELECTIVE'
        ? Reservation.elective(input.requestedBy, ELECTIVE_RESERVATION_TIMEOUT_DAYS)
        : Reservation.emergency(input.requestedBy, EMERGENCY_RESERVATION_TIMEOUT_HOURS);

    component.reserve(reservation);

    await this.bloodComponentRepository.save(component);
    await this.outboxEventWriter.write(component.pullDomainEvents());
  }
}
