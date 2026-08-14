/**
 * Read model for the "Fila de Dupla Assinatura" screen
 * (GET /donation/donations/pending-double-signature). Donations whose
 * questionnaire contained an answer to a question flagged as requiring
 * double signature, and which are still awaiting the approval step.
 */
export interface PendingDoubleSignatureRow {
    id: string;
    donorName: string;
    requiresDoubleSignature: boolean;
    questionnaireVersionId: string | null;
    checkedInAt: Date;
}

export interface GetPendingDoubleSignatureParams {
    tenantId: string;
}

export interface IGetPendingDoubleSignatureQueryPort {
    execute(params: GetPendingDoubleSignatureParams): Promise<PendingDoubleSignatureRow[]>;
}
