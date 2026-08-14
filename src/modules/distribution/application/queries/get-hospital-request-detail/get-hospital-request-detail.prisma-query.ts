import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { HospitalRequestStatus } from '../../../domain/enums/hospital-request-status.enum';
import { Urgency } from '../../../domain/enums/urgency.enum';
import { PrismaService } from '../../../../inventory/infrastructure/persistence/prisma.service';
import {
    GetHospitalRequestDetailParams,
    HospitalRequestDetailRow,
    IGetHospitalRequestDetailQueryPort,
    ShortlistItem,
} from './get-hospital-request-detail.port';

interface ShortlistJson {
    componentId: string;
    componentType?: string;
    bloodType?: { aboGroup?: string; rhFactor?: string };
    specialProcessing?: { isIrradiated?: boolean; isLeukoreduced?: boolean };
    expiresAt?: string;
}

/**
 * Read-only projection of a single hospital request, mapped to the real
 * lifecycle (8 states) so the front can render the exact status, the
 * shortlist (only when MATCHED + ELECTIVE), the linked component, and any
 * confirmed crossmatch reference.
 */
@Injectable()
export class GetHospitalRequestDetailPrismaQuery implements IGetHospitalRequestDetailQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetHospitalRequestDetailParams): Promise<HospitalRequestDetailRow | null> {
        const row = await this.prisma.hospitalRequest.findFirst({
            where: { id: params.requestId, tenantId: params.tenantId },
            include: { hospital: true },
        });
        if (!row) return null;

        const shortlistRaw = ((row.shortlist ?? []) as unknown) as ShortlistJson[];
        const showShortlist =
            row.status === HospitalRequestStatus.MATCHED && row.urgency === Urgency.ELECTIVE;
        const shortlist: ShortlistItem[] | null = showShortlist
            ? shortlistRaw.map((item) => ({
                componentId: item.componentId,
                componentType: item.componentType ?? 'UNKNOWN',
                aboGroup: item.bloodType?.aboGroup ?? 'UNKNOWN',
                rhFactor: item.bloodType?.rhFactor ?? '?',
                isIrradiated: item.specialProcessing?.isIrradiated ?? false,
                isLeukoreduced: item.specialProcessing?.isLeukoreduced ?? false,
                expiresAt: item.expiresAt ?? '',
            }))
            : null;

        let linkedComponent: HospitalRequestDetailRow['linkedComponent'] = null;
        if (row.linkedComponentId) {
            const comp = await this.prisma.bloodComponent.findUnique({
                where: { id: row.linkedComponentId },
                select: { id: true, componentType: true, aboGroup: true, rhFactor: true, status: true },
            });
            if (comp) {
                linkedComponent = {
                    id: comp.id,
                    componentType: comp.componentType,
                    aboGroup: comp.aboGroup,
                    rhFactor: comp.rhFactor,
                    status: comp.status,
                };
            }
        }

        return {
            id: row.id,
            tenantId: row.tenantId,
            hospitalId: row.hospitalId,
            hospitalName: row.hospital.name,
            requestedBloodType: {
                aboGroup: row.requestedAboGroup,
                rhFactor: row.requestedRhFactor,
                extendedPhenotype: row.requestedExtendedPhenotype,
            },
            requiredIsIrradiated: row.requiredIsIrradiated,
            requiredIsLeukoreduced: row.requiredIsLeukoreduced,
            urgency: row.urgency as Urgency,
            status: row.status as HospitalRequestStatus,
            linkedComponentId: row.linkedComponentId,
            linkedComponent,
            shortlist,
            crossmatchReference: row.crossmatchReference,
            crossmatchConfirmedBy: row.crossmatchConfirmedBy,
            rejectionReason: row.rejectionReason,
            cancellationReason: row.cancellationReason,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
