import { describe, expect, it } from 'vitest';
import { ValidityCalculatorService } from '../../src/modules/inventory/domain/services/validity-calculator.service';
import { ComponentType } from '../../src/modules/inventory/domain/enums/component-type.enum';

describe('ValidityCalculatorService', () => {
  const calculator = new ValidityCalculatorService();
  const separatedAt = new Date('2026-01-01T00:00:00.000Z');

  it('gives platelets a 5-day validity window', () => {
    const validityPeriod = calculator.calculate(ComponentType.PLATELETS, separatedAt);
    expect(validityPeriod.daysUntilExpiration(separatedAt)).toBe(5);
  });

  it('gives red blood cells a 42-day validity window', () => {
    const validityPeriod = calculator.calculate(ComponentType.RED_BLOOD_CELLS, separatedAt);
    expect(validityPeriod.daysUntilExpiration(separatedAt)).toBe(42);
  });

  it('gives plasma a 365-day validity window', () => {
    const validityPeriod = calculator.calculate(ComponentType.PLASMA, separatedAt);
    expect(validityPeriod.daysUntilExpiration(separatedAt)).toBe(365);
  });

  it('correctly identifies an expired component', () => {
    const validityPeriod = calculator.calculate(ComponentType.PLATELETS, separatedAt);
    const sixDaysLater = new Date('2026-01-07T00:00:00.000Z');
    expect(validityPeriod.isExpiredAt(sixDaysLater)).toBe(true);
  });

  it('correctly identifies a component that is still valid', () => {
    const validityPeriod = calculator.calculate(ComponentType.PLATELETS, separatedAt);
    const twoDaysLater = new Date('2026-01-03T00:00:00.000Z');
    expect(validityPeriod.isExpiredAt(twoDaysLater)).toBe(false);
  });
});
