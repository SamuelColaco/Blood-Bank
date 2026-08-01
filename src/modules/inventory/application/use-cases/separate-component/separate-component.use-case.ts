import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/domain-error';
import { DomainEvent } from '../../../../../shared/domain/domain-event.base';
import { BloodComponent } from '../../../domain/entities/blood-component.entity';
import { ComponentType } from '../../../domain/enums/component-type.enum';
import { AboGroup, BloodType, RhFactor } from '../../../domain/value-objects/blood-type.vo';
import { ValidityCalculatorService } from '../../../domain/services/validity-calculator.service';
import { IBloodBagRepository } from '../../../domain/repositories/blood-bag.repository';
import { IBloodComponentRepository } from '../../../domain/repositories/blood-component.repository';
import { IOutboxEventWriter } from '../../ports/outbox-event-writer.port';
import {
  BLOOD_BAG_REPOSITORY,
  BLOOD_COMPONENT_REPOSITORY,
  OUTBOX_EVENT_WRITER,
} from '../../tokens';

export interface ComponentToSeparate {
  componentType: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  extendedPhenotype?: string;
}

export interface SeparateComponentInput {
  bloodBagId: string;
  separatedAt: Date;
  components: ComponentToSeparate[];
}

export interface SeparateComponentOutput {
  componentIds: string[];
}

/**
 * Use case: fractionates a blood bag into its derived components
 * (e.g. red blood cells + plasma + platelets). Each component is
 * created as its own aggregate, immediately enters quarantine, and gets
 * its expiration calculated by the domain service - never hardcoded
 * here. The originating BloodBag is finalized once every component has
 * been registered against it.
 */
@Injectable()
export class SeparateComponentUseCase {
  private readonly validityCalculator = new ValidityCalculatorService();

  constructor(
    @Inject(BLOOD_BAG_REPOSITORY) private readonly bloodBagRepository: IBloodBagRepository,
    @Inject(BLOOD_COMPONENT_REPOSITORY)
    private readonly bloodComponentRepository: IBloodComponentRepository,
    @Inject(OUTBOX_EVENT_WRITER) private readonly outboxEventWriter: IOutboxEventWriter,
  ) {}

  async execute(input: SeparateComponentInput): Promise<SeparateComponentOutput> {
    const bloodBag = await this.bloodBagRepository.findById(input.bloodBagId);
    if (!bloodBag) {
      throw new DomainError(`Blood bag ${input.bloodBagId} was not found.`);
    }

    const allEvents: DomainEvent[] = [];
    const componentIds: string[] = [];

    for (const item of input.components) {
      const validityPeriod = this.validityCalculator.calculate(item.componentType, input.separatedAt);

      const component = BloodComponent.separate({
        id: randomUUID(),
        tenantId: bloodBag.tenantId,
        bloodBagId: bloodBag.id,
        componentType: item.componentType,
        bloodType: BloodType.create(item.aboGroup, item.rhFactor, item.extendedPhenotype),
        validityPeriod,
      });

      bloodBag.registerDerivedComponent(component.id);

      await this.bloodComponentRepository.save(component);
      allEvents.push(...component.pullDomainEvents());
      componentIds.push(component.id);
    }

    bloodBag.markAsFinalized();
    await this.bloodBagRepository.save(bloodBag);
    allEvents.push(...bloodBag.pullDomainEvents());

    // Single outbox write for the whole batch - all events belong to the
    // same fractionation operation and should be persisted together.
    await this.outboxEventWriter.write(allEvents);

    return { componentIds };
  }
}
