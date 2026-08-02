import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { DonationPurpose } from '../../../../shared/domain/donation-purpose.enum';

/**
 * Domain events for the Donation & Screening bounded context.
 *
 * Each event represents a meaningful state change in one of the
 * aggregates. Events are raised by aggregates and later persisted
 * to the transactional outbox by the application layer.
 */
export class DonorRegisteredEvent extends DomainEvent {
    readonly eventName = 'DonorRegistered';
    constructor(
        public readonly aggregateId: string,
        public readonly donorId: string,
        public readonly tenantId: string,
        public readonly fullName: string,
    ) {
        super();
    }
}

export class AppointmentScheduledEvent extends DomainEvent {
    readonly eventName = 'AppointmentScheduled';
    constructor(
        public readonly aggregateId: string,
        public readonly appointmentId: string,
        public readonly donorId: string,
        public readonly tenantId: string,
        public readonly scheduledAt: Date,
    ) {
        super();
    }
}

export class QuestionnaireResponseSubmittedEvent extends DomainEvent {
    readonly eventName = 'QuestionnaireResponseSubmitted';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
        public readonly tenantId: string,
    ) {
        super();
    }
}

export class EligibilityCriteriaMetEvent extends DomainEvent {
    readonly eventName = 'EligibilityCriteriaMet';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
    ) {
        super();
    }
}

export class ExclusionCriteriaTriggeredEvent extends DomainEvent {
    readonly eventName = 'ExclusionCriteriaTriggered';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
        public readonly type: 'TEMPORARY' | 'PERMANENT',
        public readonly deferralInDays: number | null,
    ) {
        super();
    }
}

export class VitalSignsRecordedEvent extends DomainEvent {
    readonly eventName = 'VitalSignsRecorded';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
    ) {
        super();
    }
}

export class DonationApprovedEvent extends DomainEvent {
    readonly eventName = 'DonationApproved';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
        public readonly donationType: 'WHOLE_BLOOD' | 'APHERESIS',
        public readonly donationPurpose: DonationPurpose,
        public readonly designatedRecipientId: string | null,
    ) {
        super();
    }
}

export class DonationRejectedEvent extends DomainEvent {
    readonly eventName = 'DonationRejected';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
        public readonly reason: string,
    ) {
        super();
    }
}

export class CollectionStartedEvent extends DomainEvent {
    readonly eventName = 'CollectionStarted';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
        public readonly donationType: 'WHOLE_BLOOD' | 'APHERESIS',
    ) {
        super();
    }
}

export class CollectionCompletedEvent extends DomainEvent {
    readonly eventName = 'CollectionCompleted';
    constructor(
        public readonly aggregateId: string,
        public readonly donationId: string,
        public readonly donorId: string,
        public readonly donationType: 'WHOLE_BLOOD' | 'APHERESIS',
        public readonly donationPurpose: DonationPurpose,
        public readonly designatedRecipientId: string | null,
        public readonly collectedAt: Date,
    ) {
        super();
    }
}

export class QuestionnaireVersionPublishedEvent extends DomainEvent {
    readonly eventName = 'QuestionnaireVersionPublished';
    constructor(
        public readonly aggregateId: string,
        public readonly versionId: string,
        public readonly tenantId: string,
        public readonly versionNumber: number,
    ) {
        super();
    }
}
