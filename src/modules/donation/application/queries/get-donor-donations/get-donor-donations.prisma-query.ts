import { Injectable } from '@nestjs/common';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    DonorDonationRow,
    GetDonorDonationsParams,
    IGetDonorDonationsQueryPort,
} from './get-donor-donations.port';

/**
 * Read-only projection of a donor's past donations.
 */
@Injectable()
export class GetDonorDonationsPrismaQuery implements IGetDonorDonationsQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetDonorDonationsParams): Promise<DonorDonationRow[]> {
        const rows = await this.prisma.donation.findMany({
            where: { donorId: params.donorId, tenantId: params.tenantId },
            orderBy: { createdAt: 'desc' },
        });

        return rows.map((row) => ({
            id: row.id,
            donationType: row.donationType as 'WHOLE_BLOOD' | 'APHERESIS',
            donationPurpose: row.donationPurpose as 'GENERAL' | 'AUTOLOGOUS' | 'DIRECTED',
            collectedAt: row.collectedAt,
            questionnaireRecorded: row.questionnaireSnapshot !== null,
            vitalSignsRecorded: row.vitalSignsRecorded,
            createdAt: row.createdAt,
        }));
    }
}
