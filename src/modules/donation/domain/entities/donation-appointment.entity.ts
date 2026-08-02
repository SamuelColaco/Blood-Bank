import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentScheduledEvent } from '../events/donation.events';

/**
 * Aggregate root representing a scheduled donation appointment.
 *
 * Short lifecycle: created when a donor schedules a donation, then
 * either completed, cancelled, or marked as no-show. Once the donation
 * is collected, this aggregate stops being actively mutated.
 */
export class DonationAppointment extends AggregateRoot<string> {
    private _status: AppointmentStatus;

    private constructor(
        id: string,
        public readonly tenantId: string,
        public readonly donorId: string,
        public readonly scheduledAt: Date,
        status: AppointmentStatus,
    ) {
        super(id);
        this._status = status;
    }

    static schedule(props: {
        id: string;
        tenantId: string;
        donorId: string;
        scheduledAt: Date;
    }): DonationAppointment {
        const appointment = new DonationAppointment(
            props.id,
            props.tenantId,
            props.donorId,
            props.scheduledAt,
            AppointmentStatus.SCHEDULED,
        );
        appointment.addDomainEvent(
            new AppointmentScheduledEvent(appointment.id, appointment.id, appointment.donorId, appointment.tenantId, appointment.scheduledAt),
        );
        return appointment;
    }

    static restore(props: {
        id: string;
        tenantId: string;
        donorId: string;
        scheduledAt: Date;
        status: AppointmentStatus;
    }): DonationAppointment {
        const appointment = new DonationAppointment(
            props.id,
            props.tenantId,
            props.donorId,
            props.scheduledAt,
            props.status,
        );
        return appointment;
    }

    get status(): AppointmentStatus {
        return this._status;
    }

    get donorIdValue(): string {
        return this.donorId;
    }

    get scheduledAtValue(): Date {
        return this.scheduledAt;
    }

    /** Marks the appointment as completed after successful collection. */
    markAsCompleted(): void {
        if (this._status !== AppointmentStatus.SCHEDULED) {
            throw new DomainError(`Cannot complete appointment ${this.id}: it is in status ${this._status}.`);
        }
        this._status = AppointmentStatus.COMPLETED;
    }

    /** Cancels the appointment before it happens. */
    cancel(): void {
        if (this._status !== AppointmentStatus.SCHEDULED) {
            throw new DomainError(`Cannot cancel appointment ${this.id}: it is in status ${this._status}.`);
        }
        this._status = AppointmentStatus.CANCELLED;
    }

    /** Marks the appointment as no-show when the donor does not appear. */
    markAsNoShow(): void {
        if (this._status !== AppointmentStatus.SCHEDULED) {
            throw new DomainError(`Cannot mark appointment ${this.id} as no-show: it is in status ${this._status}.`);
        }
        this._status = AppointmentStatus.NO_SHOW;
    }
}
