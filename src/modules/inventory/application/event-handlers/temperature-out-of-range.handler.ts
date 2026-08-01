import { Inject, Injectable } from '@nestjs/common';
import { TemperatureOutOfRangeDetectedEvent } from '../../domain/events/equipment.events';
import { IBloodComponentRepository } from '../../domain/repositories/blood-component.repository';
import { ITransactionScope } from '../../domain/ports/transaction-scope.port';
import { BLOOD_COMPONENT_REPOSITORY } from '../tokens';

/**
 * Reaction policy for TemperatureOutOfRangeDetectedEvent.
 *
 * IMPORTANT: in production, this handler is invoked by the asynchronous
 * outbox worker that consumes events from outbox_events - NOT synchronously
 * within RecordTemperatureReadingUseCase. This is what keeps a cold-chain
 * failure from turning into a single transaction that locks every
 * component stored in the affected equipment (see docs/fase-1.md, section 2,
 * and EVENT-STORMING-INVENTARIO.md, hotspot 3).
 *
 * Each affected component is loaded, flagged, and saved independently -
 * a failure reevaluating one component must never block the others.
 */
@Injectable()
export class TemperatureOutOfRangeHandler {
  constructor(
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
  ) { }

  async handle(event: TemperatureOutOfRangeDetectedEvent): Promise<void> {
    const affectedComponents = await this.bloodComponentRepository.findStoredInEquipment(
      event.aggregateId,
    );

    for (const component of affectedComponents) {
      component.flagForReevaluation();
      await this.bloodComponentRepository.save(component);
      // Note: flagForReevaluation does not raise a domain event by design -
      // it is an internal safety flag, not a fact worth its own audit
      // entry. The originating TemperatureOutOfRangeDetectedEvent is
      // already the audit record for this whole reaction.
    }
  }
}
