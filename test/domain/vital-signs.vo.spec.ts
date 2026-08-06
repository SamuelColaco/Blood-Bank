import { describe, expect, it } from 'vitest';
import { VitalSigns } from '../../src/modules/donation/domain/value-objects/vital-signs.vo';
import { DomainError } from '../../src/shared/domain/domain-error';

function buildVitalSigns(
  overrides: Partial<{
    weightInKg: number;
    hemoglobinInGdl: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
  }> = {},
): {
  weightInKg: number;
  hemoglobinInGdl: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
} {
  return {
    weightInKg: overrides.weightInKg ?? 70,
    hemoglobinInGdl: overrides.hemoglobinInGdl ?? 14,
    bloodPressureSys: overrides.bloodPressureSys ?? 120,
    bloodPressureDia: overrides.bloodPressureDia ?? 80,
  };
}

describe('VitalSigns', () => {
  it('creates a valid vital signs object', () => {
    const vs = VitalSigns.create(buildVitalSigns());
    expect(vs.weightInKg).toBe(70);
    expect(vs.hemoglobinInGdl).toBe(14);
  });

  it('rejects weight of zero or less', () => {
    expect(() => VitalSigns.create(buildVitalSigns({ weightInKg: 0 }))).toThrow(DomainError);
  });

  it('rejects non-positive hemoglobin', () => {
    expect(() => VitalSigns.create(buildVitalSigns({ hemoglobinInGdl: -1 }))).toThrow(DomainError);
  });

  it('rejects systolic pressure not greater than diastolic', () => {
    expect(() =>
      VitalSigns.create(buildVitalSigns({ bloodPressureSys: 120, bloodPressureDia: 130 })),
    ).toThrow(DomainError);
  });

  it('returns false for weight below 50kg', () => {
    const vs = VitalSigns.create(buildVitalSigns({ weightInKg: 49 }));
    expect(vs.isWithinAcceptableRange('MALE')).toBe(false);
  });

  it('allows weight at exactly 50kg', () => {
    const vs = VitalSigns.create(buildVitalSigns({ weightInKg: 50 }));
    expect(vs.isWithinAcceptableRange('MALE')).toBe(true);
  });

  it('applies the female hemoglobin minimum (12.5) and the male minimum (13.0)', () => {
    const vs = VitalSigns.create(buildVitalSigns({ hemoglobinInGdl: 12.6 }));
    expect(vs.isWithinAcceptableRange('FEMALE')).toBe(true);
    expect(vs.isWithinAcceptableRange('MALE')).toBe(false);
  });

  it('accepts a male hemoglobin at/below 18.0 and rejects above the ceiling', () => {
    const atCeiling = VitalSigns.create(buildVitalSigns({ hemoglobinInGdl: 18.0 }));
    expect(atCeiling.isWithinAcceptableRange('MALE')).toBe(true);

    const aboveCeiling = VitalSigns.create(buildVitalSigns({ hemoglobinInGdl: 18.5 }));
    expect(aboveCeiling.isWithinAcceptableRange('MALE')).toBe(false);
  });

  it('rejects systolic pressure above 180 and diastolic pressure above 100', () => {
    expect(VitalSigns.create(buildVitalSigns({ bloodPressureSys: 181 })).isWithinAcceptableRange('MALE')).toBe(false);
    expect(VitalSigns.create(buildVitalSigns({ bloodPressureDia: 110 })).isWithinAcceptableRange('MALE')).toBe(false);
  });

  it('accepts the boundary pressure of 180/100', () => {
    const vs = VitalSigns.create(buildVitalSigns({ bloodPressureSys: 180, bloodPressureDia: 100 }));
    expect(vs.isWithinAcceptableRange('MALE')).toBe(true);
  });
});