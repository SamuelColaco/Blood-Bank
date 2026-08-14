/**
 * Read model for the "Histórico de Doações" screen
 * (GET /donation/donors/:id/donations). Lists the donor's past donations.
 */
export interface DonorDonationRow {
    id: string;
    donationType: 'WHOLE_BLOOD' | 'APHERESIS';
    donationPurpose: 'GENERAL' | 'AUTOLOGOUS' | 'DIRECTED';
    collectedAt: Date | null;
    questionnaireRecorded: boolean;
    vitalSignsRecorded: boolean;
    createdAt: Date;
}

export interface GetDonorDonationsParams {
    tenantId: string;
    donorId: string;
}

export interface IGetDonorDonationsQueryPort {
    execute(params: GetDonorDonationsParams): Promise<DonorDonationRow[]>;
}
