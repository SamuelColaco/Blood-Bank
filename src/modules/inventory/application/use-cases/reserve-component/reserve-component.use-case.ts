import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { Reservation, ReservationKind } from '../../../domain/value-objects/reservation.vo';
import { TenantSettings } from '../../../domain/value-objects/tenant-settings.vo';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { ITransactionRunner } from '../../ports/transaction-runner.port';
import { ITenantSettingsRepository } from '../../../domain/repositories/tenant-settings.repository';
import { BLOOD_COMPONENT_REPOSITORY, OUTBOX_EVENT_WRITER, TRANSACTION_RUNNER, TENANT_SETTINGS_REPOSITORY } from '../../tokens';

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
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: ITransactionRunner,
    @Inject(TENANT_SETTINGS_REPOSITORY) private readonly tenantSettingsRepository: ITenantSettingsRepository,
  ) { }

  async execute(input: ReserveComponentInput): Promise<void> {
    const component = await this.bloodComponentRepository.findById(input.componentId);
    if (!component) {
      throw new DomainError(`Blood component ${input.componentId} was not found.`);
    }

    const settings = await this.tenantSettingsRepository.findByTenantId(component.tenantId);
    const effectiveSettings = settings ?? TenantSettings.defaults(component.tenantId);

    const reservation =
      input.kind === 'ELECTIVE'
        ? Reservation.elective(input.requestedBy, effectiveSettings.electiveReservationTimeoutInDays)
        : Reservation.emergency(input.requestedBy, effectiveSettings.emergencyReservationTimeoutInHours);

    component.reserve(reservation);

    await this.transactionRunner.runInTransaction(async (scope) => {
      await this.bloodComponentRepository.save(component, scope);
      await this.outboxEventWriter.write(component.pullDomainEvents(), scope);
    });
  }
}
