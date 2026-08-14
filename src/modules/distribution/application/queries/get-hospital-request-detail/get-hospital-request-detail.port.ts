import { HospitalRequestStatus } from '../../../domain/enums/hospital-request-status.enum';
import { Urgency } from '../../../domain/enums/urgency.enum';

/**
 * Read model for the "Acompanhar Solicitação / Confirmar Crossmatch /
 * Confirmar Recebimento" screens (GET /distribution/requests/:id).
 *
 * Maps the full real lifecycle (8 states - see HospitalRequestStatus) plus
 * the shortlist (only surfaced when MATCHED + ELECTIVE), the linked
 * component, and the crossmatch reference when already confirmed.
 */
export interface ShortlistItem {
    componentId: string;
    componentType: string;
    aboGroup: string;
    rhFactor: string;
    isIrradiated: boolean;
    isLeukoreduced: boolean;
    expiresAt: string;
}

export interface HospitalRequestDetailRow {
    id: string;
    tenantId: string;
    hospitalId: string;
    hospitalName: string;
    requestedBloodType: {
        aboGroup: string;
        rhFactor: string;
        extendedPhenotype: string | null;
    };
    requiredIsIrradiated: boolean;
    requiredIsLeukoreduced: boolean;
    urgency: Urgency;
    status: HospitalRequestStatus;
    linkedComponentId: string | null;
    linkedComponent: {
        id: string;
        componentType: string;
        aboGroup: string;
        rhFactor: string;
        status: string;
    } | null;
    shortlist: ShortlistItem[] | null;
    crossmatchReference: string | null;
    crossmatchConfirmedBy: string | null;
    rejectionReason: string | null;
    cancellationReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetHospitalRequestDetailParams {
    tenantId: string;
    requestId: string;
}

export interface IGetHospitalRequestDetailQueryPort {
    execute(params: GetHospitalRequestDetailParams): Promise<HospitalRequestDetailRow | null>;
}
