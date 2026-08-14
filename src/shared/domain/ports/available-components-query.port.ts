import { BloodType } from '../blood-type.vo';
import { SpecialProcessing } from '../special-processing.vo';

/**
 * Cross-context contract for querying available blood components.
 *
 * The Distribuição bounded context must never read BloodComponent through
 * the Inventory repository (that is a write/aggregate port). Availability
 * is instead exposed as a read-only query whose CONTRACT lives here in
 * shared/domain - both contexts depend on the same interface - while its
 * IMPLEMENTATION lives in the Inventory infrastructure (see SDD Fase 3,
 * section 2).
 */
export interface AvailableComponentCriteria {
  tenantId: string;
  /** The blood type a hospital request needs; compatibility (incl. O- universal donor) is resolved inside the query. */
  requestedBloodType: BloodType;
  requiredSpecialProcessing?: SpecialProcessing;
  urgency: 'ELECTIVE' | 'EMERGENCY';
}

export interface AvailableComponentMatch {
  componentId: string;
  componentType: string;
  bloodType: BloodType;
  specialProcessing: SpecialProcessing;
  expiresAt: Date;
}

export interface IAvailableComponentsQuery {
  /**
   * Returns STORED, non-expired, non-flagged components compatible with
   * the requested blood type and satisfying the required processing,
   * ordered by nearest expiration first (EMERGENCY wants the closest to
   * expiry to reduce discard - SDD Fase 3, section 5, UC-02).
   */
  findCompatible(criteria: AvailableComponentCriteria): Promise<AvailableComponentMatch[]>;
}

/** NestJS DI token shared by the Inventory (provider) and Distribution (consumer) contexts. */
export const AVAILABLE_COMPONENTS_QUERY = Symbol('IAvailableComponentsQuery');
