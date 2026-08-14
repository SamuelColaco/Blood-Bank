/**
 * Value object describing the physical processing applied to a blood
 * component BEFORE it leaves the blood center (SDD Fase 3, section 3.2).
 *
 * Shares the same home as BloodType because it is a cross-context concept:
 * the Inventory bounded context owns how the processing is APPLIED to a
 * component (applyIrradiation/applyLeukoreduction, raising their own
 * events), while the Distribuição context REASONS about which processing a
 * request requires when filtering available components.
 *
 * Note: irradiation and leukoreduction are not attributes of BloodType -
 * that keeps `extendedPhenotype` untouched. Immutable by design.
 */
export class SpecialProcessing {
  private constructor(
    public readonly isIrradiated: boolean,
    public readonly isLeukoreduced: boolean,
  ) { }

  static none(): SpecialProcessing {
    return new SpecialProcessing(false, false);
  }

  static create(isIrradiated: boolean, isLeukoreduced: boolean): SpecialProcessing {
    return new SpecialProcessing(isIrradiated, isLeukoreduced);
  }

  /** True if every required processing of `required` is present in this component. */
  satisfies(required: SpecialProcessing | null): boolean {
    if (!required) {
      return true;
    }
    if (required.isIrradiated && !this.isIrradiated) {
      return false;
    }
    if (required.isLeukoreduced && !this.isLeukoreduced) {
      return false;
    }
    return true;
  }

  copyWithIrradiated(): SpecialProcessing {
    return new SpecialProcessing(true, this.isLeukoreduced);
  }

  copyWithLeukoreduced(): SpecialProcessing {
    return new SpecialProcessing(this.isIrradiated, true);
  }
}
