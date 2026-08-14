/**
 * Read model for the "Iniciar Coleta" screen
 * (GET /donation/donations/approved-for-collection). Donors whose donation
 * has completed screening (questionnaire + vital signs) and are awaiting
 * the physical collection step.
 */
export interface ApprovedDonationRow {
    id: string;
    donorName: string;
    donationType: 'WHOLE_BLOOD' | 'APHERESIS';
    checkedInAt: Date;
}

export interface GetApprovedDonationsParams {
    tenantId: string;
}

export interface IGetApprovedDonationsQueryPort {
    execute(params: GetApprovedDonationsParams): Promise<ApprovedDonationRow[]>;
}
