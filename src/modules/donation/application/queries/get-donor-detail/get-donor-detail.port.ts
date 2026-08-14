import { DonorStatus } from '../../../domain/enums/donor-status.enum';

/**
 * Read model for the "Ficha do Doador" screen (GET /donation/donors/:id).
 * Combines the donor's current record with a summary of their donation
 * history so the screen can render an at-a-glance profile.
 */
export interface DonorDetailRow {
    id: string;
    tenantId: string;
    name: string;
    document: string;
    birthDate: Date;
    gender: 'MALE' | 'FEMALE';
    status: DonorStatus;
    deferralEndDate: Date | null;
    bloodType: string | null;
    totalDonations: number;
    lastDonationAt: Date | null;
    eligibility: {
        eligible: boolean;
        reason?: string;
        eligibleAt?: Date | null;
    };
}

export interface GetDonorDetailParams {
    tenantId: string;
    donorId: string;
}

export interface IGetDonorDetailQueryPort {
    execute(params: GetDonorDetailParams): Promise<DonorDetailRow | null>;
}
