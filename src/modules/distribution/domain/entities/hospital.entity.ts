/**
 * A partner hospital of the blood center. Plain reference data held by the
 * Distribuição bounded context (SDD Fase 3, section 6 keeps the REST shape
 * FHIR-friendly). Not an aggregate root - it has no invariants beyond
 * belonging to a tenant.
 */
export class Hospital {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
  ) { }

  static register(props: { id: string; tenantId: string; name: string }): Hospital {
    return new Hospital(props.id, props.tenantId, props.name);
  }

  static restore(id: string, tenantId: string, name: string): Hospital {
    return new Hospital(id, tenantId, name);
  }
}
