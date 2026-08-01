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
 * Immutable by design - any "change" produces a new instance.
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

  equals(other: BloodType): boolean {
    return this.aboGroup === other.aboGroup && this.rhFactor === other.rhFactor;
  }

  toString(): string {
    return `${this.aboGroup}${this.rhFactor}`;
  }
}
