/**
 * Value object representing the window during which a blood component
 * remains valid for use. Encapsulates the only two dates that matter for
 * expiration logic, keeping the calculation itself out of the entity.
 */
export class ValidityPeriod {
  private constructor(
    public readonly collectedAt: Date,
    public readonly expiresAt: Date,
  ) { }

  static fromDays(collectedAt: Date, validityInDays: number): ValidityPeriod {
    const expiresAt = new Date(collectedAt);
    expiresAt.setDate(expiresAt.getDate() + validityInDays);
    return new ValidityPeriod(collectedAt, expiresAt);
  }

  /** Reconstructs a ValidityPeriod from two already-known dates (e.g. persisted rows), without recalculating anything. */
  static restore(collectedAt: Date, expiresAt: Date): ValidityPeriod {
    return new ValidityPeriod(collectedAt, expiresAt);
  }

  isExpiredAt(referenceDate: Date): boolean {
    return referenceDate.getTime() >= this.expiresAt.getTime();
  }

  /** Used to drive the staggered expiration alerts described in PRODUTO.md (e.g. T-5 days). */
  daysUntilExpiration(referenceDate: Date): number {
    const diffInMs = this.expiresAt.getTime() - referenceDate.getTime();
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  }
}
