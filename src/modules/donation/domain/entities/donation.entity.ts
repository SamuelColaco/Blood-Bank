import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { DonationPurpose } from '../../../../shared/domain/donation-purpose.enum';
import { DonationCollectedEvent } from '../../../../shared/domain/events/donation-collected.event';
import {
    CollectionCompletedEvent,
    CollectionStartedEvent,
    DonationApprovedEvent,
    DonationRejectedEvent,
    EligibilityCriteriaMetEvent,
    ExclusionCriteriaTriggeredEvent,
    QuestionnaireResponseSubmittedEvent,
    VitalSignsRecordedEvent,
} from '../events/donation.events';

/**
 * Value object representing a snapshot of the questionnaire at the time
 * it was answered. This is immutable and preserves the exact text of each
 * question for medical-legal auditability.
 */
export interface QuestionnaireAnswer {
    questionId: string;
    questionTextAtTheTime: string;
    answer: boolean;
}

export interface QuestionnaireResponseSnapshot {
    questionnaireVersionId: string;
    answeredAt: Date;
    answers: QuestionnaireAnswer[];
}

/**
 * Value object representing an apheresis collection session.
 */
export interface ApheresisSession {
    machineId: string;
    startedAt: Date;
    durationInMinutes: number | null;
}

/**
 * Aggregate root representing a single donation session.
 *
 * This is the central aggregate of the Donation & Screening context.
 * It tracks the entire lifecycle from questionnaire response through
 * collection, and terminates by publishing DonationCollected.
 */
export class Donation extends AggregateRoot<string> {
    private _questionnaireSnapshot: QuestionnaireResponseSnapshot | null = null;
    private _vitalSignsRecorded = false;
    private _apheresisSession: ApheresisSession | null = null;
    private _collectedAt: Date | null = null;

    private constructor(
        id: string,
        public readonly tenantId: string,
        public readonly donorId: string,
        public readonly appointmentId: string | null,
        public readonly donationType: 'WHOLE_BLOOD' | 'APHERESIS',
        public readonly donationPurpose: DonationPurpose,
        public readonly designatedRecipientId: string | null,
    ) {
        super(id);
    }

    static initiate(props: {
        id: string;
        tenantId: string;
        donorId: string;
        appointmentId: string | null;
        donationType: 'WHOLE_BLOOD' | 'APHERESIS';
        donationPurpose: DonationPurpose;
        designatedRecipientId: string | null;
    }): Donation {
        return new Donation(
            props.id,
            props.tenantId,
            props.donorId,
            props.appointmentId,
            props.donationType,
            props.donationPurpose,
            props.designatedRecipientId,
        );
    }

    static restore(props: {
        id: string;
        tenantId: string;
        donorId: string;
        appointmentId: string | null;
        donationType: 'WHOLE_BLOOD' | 'APHERESIS';
        donationPurpose: DonationPurpose;
        designatedRecipientId: string | null;
        questionnaireSnapshot: QuestionnaireResponseSnapshot | null;
        vitalSignsRecorded: boolean;
        apheresisSession: ApheresisSession | null;
        collectedAt: Date | null;
    }): Donation {
        const donation = new Donation(
            props.id,
            props.tenantId,
            props.donorId,
            props.appointmentId,
            props.donationType,
            props.donationPurpose,
            props.designatedRecipientId,
        );
        donation._questionnaireSnapshot = props.questionnaireSnapshot;
        donation._vitalSignsRecorded = props.vitalSignsRecorded;
        donation._apheresisSession = props.apheresisSession;
        donation._collectedAt = props.collectedAt;
        return donation;
    }

    get questionnaireSnapshot(): QuestionnaireResponseSnapshot | null {
        return this._questionnaireSnapshot;
    }

    get vitalSignsRecorded(): boolean {
        return this._vitalSignsRecorded;
    }

    get apheresisSession(): ApheresisSession | null {
        return this._apheresisSession;
    }

    get collectedAt(): Date | null {
        return this._collectedAt;
    }

    /** Records the questionnaire response snapshot. Can only be done once. */
    recordQuestionnaireResponse(snapshot: QuestionnaireResponseSnapshot): void {
        if (this._questionnaireSnapshot !== null) {
            throw new DomainError(`Questionnaire for donation ${this.id} has already been recorded.`);
        }
        this._questionnaireSnapshot = snapshot;
        this.addDomainEvent(new QuestionnaireResponseSubmittedEvent(this.id, this.id, this.donorId, this.tenantId));
    }

    /** Records that vital signs have been checked. */
    recordVitalSigns(): void {
        if (this._vitalSignsRecorded) {
            throw new DomainError(`Vital signs for donation ${this.id} have already been recorded.`);
        }
        this._vitalSignsRecorded = true;
        this.addDomainEvent(new VitalSignsRecordedEvent(this.id, this.id, this.donorId));
    }

    /** Approves the donation after questionnaire and vital signs are complete. */
    approve(): void {
        if (this._questionnaireSnapshot === null) {
            throw new DomainError(`Cannot approve donation ${this.id}: questionnaire not recorded.`);
        }
        if (!this._vitalSignsRecorded) {
            throw new DomainError(`Cannot approve donation ${this.id}: vital signs not recorded.`);
        }
        this.addDomainEvent(
            new DonationApprovedEvent(this.id, this.id, this.donorId, this.donationType, this.donationPurpose, this.designatedRecipientId),
        );
    }

    /** Rejects the donation with a reason. */
    reject(reason: string): void {
        if (this._questionnaireSnapshot === null) {
            throw new DomainError(`Cannot reject donation ${this.id}: questionnaire not recorded.`);
        }
        this.addDomainEvent(new DonationRejectedEvent(this.id, this.id, this.donorId, reason));
    }

    /** Triggers an exclusion criterion (temporary or permanent). */
    triggerExclusion(type: 'TEMPORARY' | 'PERMANENT', deferralInDays: number | null): void {
        if (this._questionnaireSnapshot === null) {
            throw new DomainError(`Cannot trigger exclusion for donation ${this.id}: questionnaire not recorded.`);
        }
        this.addDomainEvent(
            new ExclusionCriteriaTriggeredEvent(this.id, this.id, this.donorId, type, deferralInDays),
        );
    }

    /** Marks eligibility criteria as met. */
    markEligibilityMet(): void {
        if (this._questionnaireSnapshot === null) {
            throw new DomainError(`Cannot mark eligibility for donation ${this.id}: questionnaire not recorded.`);
        }
        this.addDomainEvent(new EligibilityCriteriaMetEvent(this.id, this.id, this.donorId));
    }

    /** Starts the collection process. */
    startCollection(): void {
        if (this._collectedAt !== null) {
            throw new DomainError(`Collection for donation ${this.id} has already started.`);
        }
        this.addDomainEvent(new CollectionStartedEvent(this.id, this.id, this.donorId, this.donationType));
    }

    /** Starts an apheresis session. */
    startApheresisSession(machineId: string): void {
        if (this.donationType !== 'APHERESIS') {
            throw new DomainError(`Cannot start apheresis for donation ${this.id}: it is not an apheresis donation.`);
        }
        if (this._apheresisSession !== null) {
            throw new DomainError(`Apheresis session for donation ${this.id} has already started.`);
        }
        this._apheresisSession = {
            machineId,
            startedAt: new Date(),
            durationInMinutes: null,
        };
    }

    /** Completes the collection and publishes DonationCollected. */
    completeCollection(collectedAt: Date, isbtRangeAllocatedTo: string, questionnaireVersionId: string): void {
        if (this._collectedAt !== null) {
            throw new DomainError(`Collection for donation ${this.id} has already been completed.`);
        }
        this._collectedAt = collectedAt;

        if (this._apheresisSession && this._apheresisSession.durationInMinutes === null) {
            this._apheresisSession.durationInMinutes = Math.floor(
                (collectedAt.getTime() - this._apheresisSession.startedAt.getTime()) / 60000,
            );
        }

        this.addDomainEvent(
            new CollectionCompletedEvent(
                this.id,
                this.id,
                this.donorId,
                this.donationType,
                this.donationPurpose,
                this.designatedRecipientId,
                collectedAt,
            ),
        );

        this.addDomainEvent(
            new DonationCollectedEvent(
                this.id,
                this.id,
                this.tenantId,
                this.donorId,
                collectedAt,
                this.donationType,
                this.donationPurpose,
                this.designatedRecipientId,
                isbtRangeAllocatedTo,
                questionnaireVersionId,
            ),
        );
    }
}
