import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { DomainError } from '../../../../shared/domain/domain-error';
import { QuestionnaireVersionPublishedEvent } from '../events/donation.events';

/**
 * Value object representing a single question in the clinical questionnaire.
 */
export interface Question {
    id: string;
    text: string;
    exclusionCriterion: 'NONE' | 'TEMPORARY' | 'PERMANENT';
    deferralInDays?: number;
    requiresDoubleSignature: boolean;
    conditionalOn?: { questionId: string; expectedAnswer: boolean };
}

/**
 * Aggregate root representing a published version of the clinical questionnaire.
 *
 * Versions are immutable once published - a new version is created for any
 * change. This preserves the exact questions and criteria that were active
 * at the time of any donation, which is a medical-legal requirement.
 */
export class ClinicalQuestionnaireVersion extends AggregateRoot<string> {
    private constructor(
        id: string,
        public readonly tenantId: string,
        public readonly versionNumber: number,
        public readonly publishedAt: Date,
        public readonly publishedBy: string,
        public readonly questions: Question[],
    ) {
        super(id);
    }

    static publish(props: {
        id: string;
        tenantId: string;
        versionNumber: number;
        publishedBy: string;
        questions: Question[];
    }): ClinicalQuestionnaireVersion {
        const version = new ClinicalQuestionnaireVersion(
            props.id,
            props.tenantId,
            props.versionNumber,
            new Date(),
            props.publishedBy,
            props.questions,
        );
        version.addDomainEvent(
            new QuestionnaireVersionPublishedEvent(version.id, version.id, version.tenantId, version.versionNumber),
        );
        return version;
    }

    static restore(props: {
        id: string;
        tenantId: string;
        versionNumber: number;
        publishedAt: Date;
        publishedBy: string;
        questions: Question[];
    }): ClinicalQuestionnaireVersion {
        return new ClinicalQuestionnaireVersion(
            props.id,
            props.tenantId,
            props.versionNumber,
            props.publishedAt,
            props.publishedBy,
            props.questions,
        );
    }

    get versionNumberValue(): number {
        return this.versionNumber;
    }

    get publishedAtValue(): Date {
        return this.publishedAt;
    }

    get publishedByValue(): string {
        return this.publishedBy;
    }

    get questionsValue(): Question[] {
        return this.questions;
    }
}
