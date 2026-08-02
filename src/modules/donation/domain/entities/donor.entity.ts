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

    private constructor(
        id: string,
        public readonly tenantId: string,
        public readonly fullName: string,
        public readonly documentId: string,
        public readonly birthDate: Date,
        public readonly gender: 'MALE' | 'FEMALE',
        status: DonorStatus,
    ) {
        super(id);
        this._status = status;
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
    }): Donor {
        const donor = new Donor(
            props.id,
            props.tenantId,
            props.fullName,
            props.documentId,
            props.birthDate,
            props.gender,
            props.status,
        );
        return donor;
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

    /** Marks the donor as inactive due to a temporary or permanent exclusion. */
    markAsInactive(): void {
        if (this._status === DonorStatus.INACTIVE) {
            throw new DomainError(`Donor ${this.id} is already inactive.`);
        }
        this._status = DonorStatus.INACTIVE;
    }

    /** Reactivates a donor after a temporary deferral period has passed. */
    reactivate(): void {
        if (this._status === DonorStatus.ACTIVE) {
            throw new DomainError(`Donor ${this.id} is already active.`);
        }
        this._status = DonorStatus.ACTIVE;
    }
}
