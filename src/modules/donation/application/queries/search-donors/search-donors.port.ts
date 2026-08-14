import { DonorStatus } from '../../../domain/enums/donor-status.enum';

/**
 * Read model for the "Busca de Doador" screen (GET /donation/donors).
 * Pure read projection against the donors table - never reconstructs the
 * Donor aggregate.
 */
export interface SearchDonorRow {
    id: string;
    name: string;
    document: string;
    /** The donor aggregate does not currently hold a blood type - always null until the schema models it. */
    bloodType: string | null;
    status: DonorStatus;
    deferralEndDate: Date | null;
}

export interface SearchDonorsParams {
    tenantId: string;
    query: string;
}

export interface ISearchDonorsQueryPort {
    execute(params: SearchDonorsParams): Promise<SearchDonorRow[]>;
}
