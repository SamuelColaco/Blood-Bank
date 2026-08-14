import { Inject, Injectable } from '@nestjs/common';
import { FlagComponentForReevaluationUseCase } from '../../../../modules/inventory/application/use-cases/flag-component-for-reevaluation/flag-component-for-reevaluation.use-case';
import { IHospitalRequestRepository } from '../../domain/repositories/hospital-request.repository';
import { TransportTemperatureOutOfRangeDetectedEvent } from '../../domain/events/transport-container.events';
import { HOSPITAL_REQUEST_REPOSITORY } from '../tokens';

/**
 * Reaction policy for TransportTemperatureOutOfRangeDetectedEvent.
 *
 * In production this runs asynchronously from the outbox worker. When a
 * container reports a breach, the component linked to that delivery is
 * flagged for reevaluation through the Inventory-owned
 * FlagComponentForReevaluationUseCase - Distribuição never mutates
 * BloodComponent directly (SDD Fase 3, section 2). The component itself is
 * not modified beyond the flag; a human still confirms safety or discards.
 */
@Injectable()
export class TransportTemperatureOutOfRangeHandler {
  constructor(
    @Inject(HOSPITAL_REQUEST_REPOSITORY)
    private readonly hospitalRequestRepository: IHospitalRequestRepository,
    private readonly flagComponentForReevaluationUseCase: FlagComponentForReevaluationUseCase,
  ) { }

  async handle(event: TransportTemperatureOutOfRangeDetectedEvent): Promise<void> {
    const request = await this.hospitalRequestRepository.findById(event.hospitalRequestId);
    if (!request?.linkedComponentId) {
      return;
    }
    await this.flagComponentForReevaluationUseCase.execute({
      componentId: request.linkedComponentId,
    });
  }
}
