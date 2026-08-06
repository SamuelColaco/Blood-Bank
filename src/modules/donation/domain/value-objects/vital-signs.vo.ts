import { DomainError } from '../../../../shared/domain/domain-error';

/**
 * Value object representing the clinical vital signs captured at the point
 * of donation (UC-03).
 *
 * Regulatory basis (RDC n. 34/2014):
 *  - Minimum weight: 50 kg (no upper bound defined by the norm - values
 *    above are accepted, the ceiling in older drafts was removed because
 *    it is not regulatory).
 *  - Hemoglobin: minimum of 12.5 g/dL for women and 13.0 g/dL for men,
 *    with an upper ceiling of 18.0 g/dL, above which the candidate is
 *    deferred and referred for clinical investigation. Because the
 *    acceptable range is sex-dependent, validation is NOT done here - it
 *    is exposed via {@link isWithinAcceptableRange(gender)} so the caller
 *    (which knows the donor's sex) decides eligibility.
 *  - Blood pressure: consolidated 90/60–180/100 mmHg (systolic must not
 *    exceed 180 and diastolic must not exceed 100).
 *
 * This value object stays pure: `create` validates only structural sanity
 * (positive values, systolic > diastolic). The clinical eligibility check
 * is intentionally deferred to {@link isWithinAcceptableRange}, which
 * requires the donor's sex as context - per the shared-contracts decision,
 * engineering should not hard-code a single-sex range inside an immutable VO.
 *
 * NOTE: these are regulatory/industry defaults, not a clinical decision
 * locked by engineering. They should be reviewed with the blood center's
 * technical staff before production. See ValidityCalculatorService for the
 * same caveat about defaults.
 */
export interface VitalSignsValues {
    weightInKg: number;
    hemoglobinInGdl: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
}

export class VitalSigns {
    private constructor(
        public readonly weightInKg: number,
        public readonly hemoglobinInGdl: number,
        public readonly bloodPressureSys: number,
        public readonly bloodPressureDia: number,
    ) { }

    static create(props: VitalSignsValues): VitalSigns {
        if (!Number.isFinite(props.weightInKg) || props.weightInKg <= 0) {
            throw new DomainError(`Weight must be a positive number, got ${props.weightInKg}.`);
        }
        if (!Number.isFinite(props.hemoglobinInGdl) || props.hemoglobinInGdl <= 0) {
            throw new DomainError(`Hemoglobin must be a positive number, got ${props.hemoglobinInGdl}.`);
        }
        if (!Number.isFinite(props.bloodPressureSys) || props.bloodPressureSys <= 0) {
            throw new DomainError(`Systolic blood pressure must be a positive number, got ${props.bloodPressureSys}.`);
        }
        if (!Number.isFinite(props.bloodPressureDia) || props.bloodPressureDia <= 0) {
            throw new DomainError(`Diastolic blood pressure must be a positive number, got ${props.bloodPressureDia}.`);
        }
        if (props.bloodPressureSys <= props.bloodPressureDia) {
            throw new DomainError(
                `Systolic pressure (${props.bloodPressureSys}) must be greater than diastolic (${props.bloodPressureDia}).`,
            );
        }
        return new VitalSigns(
            props.weightInKg,
            props.hemoglobinInGdl,
            props.bloodPressureSys,
            props.bloodPressureDia,
        );
    }

    static restore(props: VitalSignsValues): VitalSigns {
        return new VitalSigns(
            props.weightInKg,
            props.hemoglobinInGdl,
            props.bloodPressureSys,
            props.bloodPressureDia,
        );
    }

    /**
     * Clinical eligibility check (UC-03): does this donor's vital signs fall
     * within the acceptable range for their sex?
     *
     * Returns false (without throwing) when a value is out of range, so the
     * calling use case can decide whether to block approval. Single range
     * here would be wrong, so hemoglobin is validated against the donor's sex.
     */
    isWithinAcceptableRange(gender: 'MALE' | 'FEMALE'): boolean {
        if (this.weightInKg < 50) {
            return false;
        }

        const hemoglobinMin = gender === 'FEMALE' ? 12.5 : 13.0;
        if (this.hemoglobinInGdl < hemoglobinMin || this.hemoglobinInGdl > 18.0) {
            return false;
        }

        if (this.bloodPressureSys < 90 || this.bloodPressureSys > 180) {
            return false;
        }
        if (this.bloodPressureDia < 60 || this.bloodPressureDia > 100) {
            return false;
        }

        return true;
    }
}
