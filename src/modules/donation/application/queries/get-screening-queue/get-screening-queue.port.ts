/**
 * Read model for the "Fila de Triagem" screen (GET /donation/screening-queue).
 * Donations awaiting clinical screening, ordered by check-in (creation) time.
 */
export interface ScreeningQueueRow {
    id: string;
    donorName: string;
    donationType: 'WHOLE_BLOOD' | 'APHERESIS';
    questionnaireRecorded: boolean;
    vitalSignsRecorded: boolean;
    checkedInAt: Date;
}

export interface GetScreeningQueueParams {
    tenantId: string;
}

export interface IGetScreeningQueueQueryPort {
    execute(params: GetScreeningQueueParams): Promise<ScreeningQueueRow[]>;
}
