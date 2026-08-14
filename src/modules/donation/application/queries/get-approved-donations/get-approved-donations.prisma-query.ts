import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    ApprovedDonationRow,
    GetApprovedDonationsParams,
    IGetApprovedDonationsQueryPort,
} from './get-approved-donations.port';

/**
 * Read-only projection of donations that have cleared screening (questionnaire
 * recorded + vital signs recorded) and are therefore awaiting the physical
 * collection step.
 *
 * NOTE: the Donation aggregate does not persist an explicit "approved" flag -
 * it is inferred from screening completion + not-yet-collected. See SDD.
 */
@Injectable()
export class GetApprovedDonationsPrismaQuery implements IGetApprovedDonationsQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetApprovedDonationsParams): Promise<ApprovedDonationRow[]> {
        const rows = await this.prisma.donation.findMany({
            where: {
                tenantId: params.tenantId,
                collectedAt: null,
                questionnaireSnapshot: { not: Prisma.DbNull },
                vitalSignsRecorded: true,
            },
            include: { donor: true },
            orderBy: { createdAt: 'asc' },
        });

        return rows.map((row) => ({
            id: row.id,
            donorName: row.donor.fullName,
            donationType: row.donationType as 'WHOLE_BLOOD' | 'APHERESIS',
            checkedInAt: row.createdAt,
        }));
    }
}
