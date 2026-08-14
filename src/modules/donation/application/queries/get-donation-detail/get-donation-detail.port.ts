/**
 * Read model for the Sinais Vitais / Decisão de Aptidão / Finalizar Coleta
 * screens (GET /donation/donations/:id). A full snapshot of a single
 * donation, including an audit-friendly copy of the questionnaire, the
 * recorded vital signs, and the donor's sex (needed to re-derive the
 * acceptable hemoglobin range client-side).
 */
export interface DonationDetailRow {
    id: string;
    tenantId: string;
    donorId: string;
    donorName: string;
    donorGender: 'MALE' | 'FEMALE';
    appointmentId: string | null;
    donationType: 'WHOLE_BLOOD' | 'APHERESIS';
    donationPurpose: 'GENERAL' | 'AUTOLOGOUS' | 'DIRECTED';
    designatedRecipientId: string | null;
    questionnaire: {
        questionnaireVersionId: string;
        answeredAt: Date;
        answers: { questionId: string; questionTextAtTheTime: string; answer: boolean }[];
    } | null;
    vitalSigns: {
        weightInKg: number;
        hemoglobinInGdl: number;
        bloodPressureSys: number;
        bloodPressureDia: number;
    } | null;
    apheresisSession: { machineId: string; startedAt: Date; durationInMinutes: number | null } | null;
    collectedAt: Date | null;
    createdAt: Date;
}

export interface GetDonationDetailParams {
    tenantId: string;
    donationId: string;
}

export interface IGetDonationDetailQueryPort {
    execute(params: GetDonationDetailParams): Promise<DonationDetailRow | null>;
}
