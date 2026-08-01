import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { IEquipmentRepository } from '../../../domain/repositories/equipment.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import { EQUIPMENT_REPOSITORY, OUTBOX_EVENT_WRITER } from '../../tokens';

export interface RecordTemperatureReadingInput {
  equipmentId: string;
  value: number;
}

/**
 * Use case: records a new temperature reading from a piece of equipment
 * (freezer, refrigerator, platelet agitator). If the reading breaches the
 * safe range, a TemperatureOutOfRangeDetectedEvent is written to the
 * outbox. The actual reevaluation of components stored in this equipment
 * happens asynchronously, in TemperatureOutOfRangeHandler - never inline
 * in this use case. See docs/fase-1.md, section 2.
 */
@Injectable()
export class RecordTemperatureReadingUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY) private readonly equipmentRepository: IEquipmentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) {}

  async execute(input: RecordTemperatureReadingInput): Promise<void> {
    const equipment = await this.equipmentRepository.findById(input.equipmentId);
    if (!equipment) {
      throw new DomainError(`Equipment ${input.equipmentId} was not found.`);
    }

    equipment.recordTemperatureReading(input.value);

    await this.equipmentRepository.save(equipment);
    await this.outboxEventWriter.write(equipment.pullDomainEvents());
  }
}
