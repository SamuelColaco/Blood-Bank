export type ReservationKind = 'ELECTIVE' | 'EMERGENCY';

/**
 * Value object representing an active reservation of a BloodComponent
 * for a hospital request. Two timeout profiles exist by design decision
 * (see DECISOES-HOTSPOTS.md): elective reservations last days, emergency
 * reservations last hours. A component can hold at most one reservation
 * at a time - enforced by BloodComponent, not by this value object.
 */
export class Reservation {
  private constructor(
    public readonly requestedBy: string,
    public readonly kind: ReservationKind,
    public readonly expiresAt: Date,
  ) { }

  static elective(requestedBy: string, timeoutInDays: number): Reservation {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + timeoutInDays);
    return new Reservation(requestedBy, 'ELECTIVE', expiresAt);
  }

  static emergency(requestedBy: string, timeoutInHours: number): Reservation {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timeoutInHours);
    return new Reservation(requestedBy, 'EMERGENCY', expiresAt);
  }

  /** Reconstructs a Reservation from an already-known expiration date (e.g. a persisted row). */
  static restore(requestedBy: string, kind: ReservationKind, expiresAt: Date): Reservation {
    return new Reservation(requestedBy, kind, expiresAt);
  }

  isExpiredAt(referenceDate: Date): boolean {
    return referenceDate.getTime() >= this.expiresAt.getTime();
  }
}
