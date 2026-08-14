import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    ComponentDetailRow,
    GetComponentDetailParams,
    IGetComponentDetailQueryPort,
} from './get-component-detail.port';

/**
 * Read-only projection of a single blood component's detail.
 */
@Injectable()
export class GetComponentDetailPrismaQuery implements IGetComponentDetailQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetComponentDetailParams): Promise<ComponentDetailRow | null> {
        const row = await this.prisma.bloodComponent.findFirst({
            where: { id: params.componentId, tenantId: params.tenantId },
        });
        if (!row) return null;

        return {
            id: row.id,
            tenantId: row.tenantId,
            bloodBagId: row.bloodBagId,
            equipmentId: row.equipmentId,
            componentType: row.componentType,
            aboGroup: row.aboGroup,
            rhFactor: row.rhFactor,
            extendedPhenotype: row.extendedPhenotype,
            status: row.status,
            collectedAt: row.collectedAt,
            expiresAt: row.expiresAt,
            isUnderReevaluation: row.isUnderReevaluation,
            isIrradiated: row.isIrradiated,
            isLeukoreduced: row.isLeukoreduced,
            donationPurpose: row.donationPurpose as ComponentDetailRow['donationPurpose'],
            designatedRecipientId: row.designatedRecipientId,
        };
    }
}
