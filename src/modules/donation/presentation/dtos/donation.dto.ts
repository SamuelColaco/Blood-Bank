import { z } from 'zod';

/**
 * Input contracts for the Donation & Screening write endpoints, validated
 * with zod before they reach a use case - keeping the domain layer free of
 * HTTP/validation concerns.
 */

export const registerDonorSchema = z.object({
    tenantId: z.string().uuid(),
    fullName: z.string().min(1),
    documentId: z.string().min(1),
    birthDate: z.coerce.date(),
    gender: z.enum(['MALE', 'FEMALE']),
});

export const scheduleAppointmentSchema = z.object({
    tenantId: z.string().uuid(),
    donorId: z.string().uuid(),
    scheduledAt: z.coerce.date(),
});

export const recordQuestionnaireResponseSchema = z.object({
    questionnaireVersionId: z.string().min(1),
    answers: z.array(
        z.object({
            questionId: z.string().min(1),
            questionTextAtTheTime: z.string().min(1),
            answer: z.boolean(),
        }),
    ),
});

export const recordVitalSignsSchema = z.object({
    weightInKg: z.number().positive(),
    hemoglobinInGdl: z.number().positive(),
    bloodPressureSys: z.number().positive(),
    bloodPressureDia: z.number().positive(),
});

export const approveDonationSchema = z.object({
    donationType: z.enum(['WHOLE_BLOOD', 'APHERESIS']),
});

export const rejectDonationSchema = z.object({
    reason: z.string().min(1),
});

export const startCollectionSchema = z.object({
    donationType: z.enum(['WHOLE_BLOOD', 'APHERESIS']),
    machineId: z.string().uuid().optional(),
});

export const completeCollectionSchema = z.object({
    collectedAt: z.coerce.date(),
    isbtRangeAllocatedTo: z.string().min(1),
    questionnaireVersionId: z.string().min(1),
});

export const publishQuestionnaireVersionSchema = z.object({
    tenantId: z.string().uuid(),
    publishedBy: z.string().min(1),
    questions: z.array(
        z.object({
            id: z.string().min(1),
            text: z.string().min(1),
            exclusionCriterion: z.enum(['NONE', 'TEMPORARY', 'PERMANENT']),
            deferralInDays: z.number().int().positive().optional(),
            requiresDoubleSignature: z.boolean(),
            conditionalOn: z
                .object({ questionId: z.string().min(1), expectedAnswer: z.boolean() })
                .optional(),
        }),
    ),
});

export const syncOfflineDataSchema = z.object({
    events: z.array(z.record(z.string(), z.unknown())),
});

export type RegisterDonorDto = z.infer<typeof registerDonorSchema>;
export type ScheduleAppointmentDto = z.infer<typeof scheduleAppointmentSchema>;
export type RecordQuestionnaireResponseDto = z.infer<typeof recordQuestionnaireResponseSchema>;
export type RecordVitalSignsDto = z.infer<typeof recordVitalSignsSchema>;
export type ApproveDonationDto = z.infer<typeof approveDonationSchema>;
export type RejectDonationDto = z.infer<typeof rejectDonationSchema>;
export type StartCollectionDto = z.infer<typeof startCollectionSchema>;
export type CompleteCollectionDto = z.infer<typeof completeCollectionSchema>;
export type PublishQuestionnaireVersionDto = z.infer<typeof publishQuestionnaireVersionSchema>;
export type SyncOfflineDataDto = z.infer<typeof syncOfflineDataSchema>;
