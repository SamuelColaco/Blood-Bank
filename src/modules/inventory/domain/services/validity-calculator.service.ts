import { ComponentType } from '../enums/component-type.enum';
import { ValidityPeriod } from '../value-objects/validity-period.vo';

/**
 * Domain service that calculates how long a blood component remains
 * valid for use, based on its type and the moment it was separated from
 * the original blood bag. It is a pure function of domain rules and has
 * no dependency on persistence or infrastructure - that is what makes it
 * a domain service instead of living inside an entity.
 *
 * Validity windows follow standard Brazilian hemotherapy practice:
 * - Red blood cells: ~42 days, refrigerated
 * - Platelets: ~5 days, at room temperature, under constant agitation
 * - Plasma: up to ~365 days, frozen
 * - Cryoprecipitate: up to ~365 days, frozen
 *
 * IMPORTANT: these numbers are industry-standard defaults, not a
 * clinical decision made by the engineering team. Validate them with a
 * hemotherapy specialist before relying on them in production.
 */
export class ValidityCalculatorService {
  private static readonly VALIDITY_IN_DAYS: Record<ComponentType, number> = {
    [ComponentType.RED_BLOOD_CELLS]: 42,
    [ComponentType.PLATELETS]: 5,
    [ComponentType.PLASMA]: 365,
    [ComponentType.CRYOPRECIPITATE]: 365,
  };

  calculate(componentType: ComponentType, separatedAt: Date): ValidityPeriod {
    const validityInDays = ValidityCalculatorService.VALIDITY_IN_DAYS[componentType];
    return ValidityPeriod.fromDays(separatedAt, validityInDays);
  }
}
