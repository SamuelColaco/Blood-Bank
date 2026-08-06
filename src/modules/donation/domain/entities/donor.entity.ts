import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { DonorStatus } from '../enums/donor-status.enum';
import { DonorRegisteredEvent } from '../events/donation.events';

/**
 * Aggregate root representing a blood donor.
 *
 * A donor has a lifecycle: once registered, they can schedule appointments,
 * undergo screening, and donate. Their status can become INACTIVE when
 * a temporary or permanent exclusion criterion is triggered.
 */
export class Donor extends AggregateRoot<string> {
    private _status: DonorStatus;
    private _deferralEndDate: Date | null = null;
    private _lastDonationAt: Date | null = null;

    private constructor(
        id: string,
        public readonly tenantId: string,
        public readonly fullName: string,
        public readonly documentId: string,
        public readonly birthDate: Date,
        public readonly gender: 'MALE' | 'FEMALE',
        status: DonorStatus,
        deferralEndDate: Date | null,
        lastDonationAt: Date | null,
    ) {
        super(id);
        this._status = status;
        this._deferralEndDate = deferralEndDate;
        this._lastDonationAt = lastDonationAt;
    }

    static register(props: {
        id: string;
        tenantId: string;
        fullName: string;
        documentId: string;
        birthDate: Date;
        gender: 'MALE' | 'FEMALE';
    }): Donor {
        const donor = new Donor(
            props.id,
            props.tenantId,
            props.fullName,
            props.documentId,
            props.birthDate,
            props.gender,
            DonorStatus.ACTIVE,
            null,
            null,
        );
        donor.addDomainEvent(new DonorRegisteredEvent(donor.id, donor.id, donor.tenantId, donor.fullName));
        return donor;
    }

    static restore(props: {
        id: string;
        tenantId: string;
        fullName: string;
        documentId: string;
        birthDate: Date;
        gender: 'MALE' | 'FEMALE';
        status: DonorStatus;
        deferralEndDate?: Date | null;
        lastDonationAt?: Date | null;
    }): Donor {
        return new Donor(
            props.id,
            props.tenantId,
            props.fullName,
            props.documentId,
            props.birthDate,
            props.gender,
            props.status,
            props.deferralEndDate ?? null,
            props.lastDonationAt ?? null,
        );
    }

    get status(): DonorStatus {
        return this._status;
    }

    get documentIdValue(): string {
        return this.documentId;
    }

    get birthDateValue(): Date {
        return this.birthDate;
    }

    get genderValue(): 'MALE' | 'FEMALE' {
        return this.gender;
    }

    get deferralEndDate(): Date | null {
        return this._deferralEndDate;
    }

    get lastDonationAt(): Date | null {
        return this._lastDonationAt;
    }

    /**
     * Marks the donor as inactive due to a temporary or permanent exclusion.
     *
     * For a temporary exclusion, deferralInDays sets the concrete date from
     * which the donor becomes eligible again (deferralEndDate = now + days).
     * For a permanent exclusion, deferralInDays is null and the donor has no
     * automatic reactivation date.
     */
    markAsInactive(deferralInDays: number | null): void {
        if (this._status === DonorStatus.INACTIVE) {
            throw new DomainError(`Donor ${this.id} is already inactive.`);
        }
        this._status = DonorStatus.INACTIVE;
        this._deferralEndDate = deferralInDays !== null
            ? new Date(Date.now() + deferralInDays * 24 * 60 * 60 * 1000)
            : null;
    }

    /**
     * Reactivates a donor after a temporary deferral period has passed.
     *
     * A permanent exclusion (deferralEndDate === null) can never be
     * reactivated through this method. A temporary exclusion is only
     * reactivable once its deferral end date is in the past.
     */
    reactivate(): void {
        if (this._status === DonorStatus.ACTIVE) {
            throw new DomainError(`Donor ${this.id} is already active.`);
        }
        if (this._deferralEndDate === null) {
            throw new DomainError(`Donor ${this.id} has a permanent exclusion and cannot be reactivated.`);
        }
        if (this._deferralEndDate.getTime() > Date.now()) {
            throw new DomainError(`Donor ${this.id} is still in deferral until ${this._deferralEndDate.toISOString()}.`);
        }
        this._status = DonorStatus.ACTIVE;
        this._deferralEndDate = null;
    }

    /**
     * Records the date of a completed donation. This drives the routine
     * in-between-donation interval check in isEligibleToDonate.
     */
    recordDonation(date: Date): void {
        this._lastDonationAt = date;
    }

    /**
     * Eligibility check that answers "when can this donor donate again?".
     *
     * Combines three rules (per RDC 34/2014):
     *  - donor must not be in an active deferral period;
     *  - donors must respect the routine interval between donations:
     *    60 days for men, 90 days for women, counted from the last donation.
     *
     * Returns the eligibility decision and, when the donor is not eligible
     * for a time-based reason, the concrete date from which they become
     * eligible (eligibleAt).
     */
    isEligibleToDonate(): {
        eligible: boolean;
        reason?: string;
        eligibleAt?: Date;
    } {
        if (this._status === DonorStatus.INACTIVE && this._deferralEndDate === null) {
            return { eligible: false, reason: 'Donor has a permanent exclusion.' };
        }
        if (this._deferralEndDate !== null && this._deferralEndDate.getTime() > Date.now()) {
            return {
                eligible: false,
                reason: `Donor is in deferral until ${this._deferralEndDate.toISOString()}.`,
                eligibleAt: this._deferralEndDate,
            };
        }

        if (this._lastDonationAt !== null) {
            const intervalInDays = this.gender === 'MALE' ? 60 : 90;
            const nextAllowedAt = new Date(
                this._lastDonationAt.getTime() + intervalInDays * 24 * 60 * 60 * 1000,
            );
            if (nextAllowedAt.getTime() > Date.now()) {
                return {
                    eligible: false,
                    reason: `Donor must wait until ${nextAllowedAt.toISOString()} (${intervalInDays} days interval for ${this.gender.toLowerCase()}s).`,
                    eligibleAt: nextAllowedAt,
                };
            }
        }

        return { eligible: true };
    }
}
