import { Injectable } from '@nestjs/common';
import { HospitalRequestStatus } from '../../../domain/enums/hospital-request-status.enum';
import { PrismaService } from '../../../../inventory/infrastructure/persistence/prisma.service';
import {
    HospitalRequestListItem,
    IListHospitalRequestsQueryPort,
    ListHospitalRequestsParams,
    ListHospitalRequestsResult,
} from './list-hospital-requests.port';

/**
 * Read-only, paginated projection of the hospital requests history.
 */
@Injectable()
export class ListHospitalRequestsPrismaQuery implements IListHospitalRequestsQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: ListHospitalRequestsParams): Promise<ListHospitalRequestsResult> {
        const page = params.page && params.page > 0 ? params.page : 1;
        const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;

        const where: Record<string, unknown> = { tenantId: params.tenantId };
        if (params.hospitalId) where.hospitalId = params.hospitalId;
        if (params.status) where.status = params.status as HospitalRequestStatus;

        const [rows, total] = await Promise.all([
            this.prisma.hospitalRequest.findMany({
                where,
                include: { hospital: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.hospitalRequest.count({ where }),
        ]);

        const items: HospitalRequestListItem[] = rows.map((row) => ({
            id: row.id,
            hospitalId: row.hospitalId,
            hospitalName: row.hospital.name,
            requestedAboGroup: row.requestedAboGroup,
            requestedRhFactor: row.requestedRhFactor,
            urgency: row.urgency as 'ELECTIVE' | 'EMERGENCY',
            status: row.status as HospitalRequestStatus,
            linkedComponentId: row.linkedComponentId,
            createdAt: row.createdAt,
        }));

        return { items, total, page, pageSize };
    }
}
