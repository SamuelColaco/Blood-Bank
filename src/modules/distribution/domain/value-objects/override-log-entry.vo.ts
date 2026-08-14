/**
 * Immutable record of a hospital explicitly overriding the auto-picked
 * component (ELECTIVE requests). Overrides are never deleted - they become
 * real data for evaluating whether expiry-based prioritization is actually
 * reducing discard or whether hospitals systematically diverge from it
 * (SDD Fase 3, UC-02 hotspot).
 */
export class OverrideLogEntry {
  private constructor(
    public readonly previousComponentId: string,
    public readonly chosenComponentId: string,
    public readonly reason: string | null,
    public readonly at: Date,
  ) { }

  static record(
    previousComponentId: string,
    chosenComponentId: string,
    reason: string | null,
  ): OverrideLogEntry {
    return new OverrideLogEntry(previousComponentId, chosenComponentId, reason, new Date());
  }

  static restore(
    previousComponentId: string,
    chosenComponentId: string,
    reason: string | null,
    at: Date,
  ): OverrideLogEntry {
    return new OverrideLogEntry(previousComponentId, chosenComponentId, reason, at);
  }
}
