import { HospitalRequestStatus } from '../../../domain/enums/hospital-request-status.enum';

/**
 * Read model for the "Histórico de Solicitações" screen
 * (GET /distribution/requests). A paginated list of hospital requests.
 */
export interface HospitalRequestListItem {
    id: string;
    hospitalId: string;
    hospitalName: string;
    requestedAboGroup: string;
    requestedRhFactor: string;
    urgency: 'ELECTIVE' | 'EMERGENCY';
    status: HospitalRequestStatus;
    linkedComponentId: string | null;
    createdAt: Date;
}

export interface ListHospitalRequestsParams {
    tenantId: string;
    hospitalId?: string;
    status?: HospitalRequestStatus;
    page?: number;
    pageSize?: number;
}

export interface ListHospitalRequestsResult {
    items: HospitalRequestListItem[];
    total: number;
    page: number;
    pageSize: number;
}

export interface IListHospitalRequestsQueryPort {
    execute(params: ListHospitalRequestsParams): Promise<ListHospitalRequestsResult>;
}
