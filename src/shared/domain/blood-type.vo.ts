export enum AboGroup {
  A = 'A',
  B = 'B',
  AB = 'AB',
  O = 'O',
}

export enum RhFactor {
  POSITIVE = '+',
  NEGATIVE = '-',
}

/**
 * Value object representing a blood type: ABO group, Rh factor, and an
 * optional extended phenotype panel for special cases (e.g. multiply
 * transfused patients who need more than a simple ABO/Rh match).
 *
 * Lives in shared/domain because it is a cross-context concept: the
 * Inventory bounded context owns BloodComponent, but the Distribution
 * context reasons about requested/required blood types when matching
 * a hospital request against available components (see SDD Fase 3,
 * section 2). Immutable by design - any "change" produces a new instance.
 */
export class BloodType {
  private constructor(
    public readonly aboGroup: AboGroup,
    public readonly rhFactor: RhFactor,
    public readonly extendedPhenotype?: string,
  ) { }

  static create(aboGroup: AboGroup, rhFactor: RhFactor, extendedPhenotype?: string): BloodType {
    return new BloodType(aboGroup, rhFactor, extendedPhenotype);
  }

  /** O-negative is the universal donor type, reserved for emergencies. */
  get isUniversalDonor(): boolean {
    return this.aboGroup === AboGroup.O && this.rhFactor === RhFactor.NEGATIVE;
  }

  /**
   * Transfusion compatibility: can a component with `donor` blood type be
   * given to a recipient with `recipient` blood type? Follows the ABO/Rh
   * compatibility matrix - O is the universal donor, AB the universal
   * recipient, Rh- can be given to Rh+ or Rh-, Rh+ only to Rh+.
   */
  static isCompatible(donor: BloodType, recipient: BloodType): boolean {
    const aboCompatible =
      donor.aboGroup === AboGroup.O ||
      donor.aboGroup === recipient.aboGroup ||
      (recipient.aboGroup === AboGroup.AB &&
        (donor.aboGroup === AboGroup.A || donor.aboGroup === AboGroup.B));
    if (!aboCompatible) {
      return false;
    }
    if (donor.rhFactor === RhFactor.POSITIVE && recipient.rhFactor === RhFactor.NEGATIVE) {
      return false;
    }
    return true;
  }

  /** Extended phenotype, when required, must match exactly. */
  static hasRequiredPhenotype(donor: BloodType, requiredPhenotype: string | undefined): boolean {
    if (!requiredPhenotype) {
      return true;
    }
    return donor.extendedPhenotype === requiredPhenotype;
  }

  equals(other: BloodType): boolean {
    return this.aboGroup === other.aboGroup && this.rhFactor === other.rhFactor;
  }

  toString(): string {
    return `${this.aboGroup}${this.rhFactor}`;
  }
}
