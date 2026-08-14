import { Injectable } from '@nestjs/common';
import { DonorStatus } from '../../../domain/enums/donor-status.enum';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    DonorDetailRow,
    GetDonorDetailParams,
    IGetDonorDetailQueryPort,
} from './get-donor-detail.port';

/**
 * Read-only Prisma implementation of the donor detail. Mirrors the
 * eligibility rules from Donor.isEligibleToDonate without reconstructing
 * the aggregate - the projection owns a read-only copy of the rules.
 */
@Injectable()
export class GetDonorDetailPrismaQuery implements IGetDonorDetailQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetDonorDetailParams): Promise<DonorDetailRow | null> {
        const donor = await this.prisma.donor.findFirst({
            where: { id: params.donorId, tenantId: params.tenantId },
        });
        if (!donor) return null;

        const donations = await this.prisma.donation.count({
            where: { donorId: donor.id, tenantId: donor.tenantId, collectedAt: { not: null } },
        });

        return {
            id: donor.id,
            tenantId: donor.tenantId,
            name: donor.fullName,
            document: donor.documentId,
            birthDate: donor.birthDate,
            gender: donor.gender as 'MALE' | 'FEMALE',
            status: donor.status as DonorStatus,
            deferralEndDate: donor.deferralEndDate,
            bloodType: null,
            totalDonations: donations,
            lastDonationAt: donor.lastDonationAt,
            eligibility: this.computeEligibility(donor as any),
        };
    }

    private computeEligibility(donor: {
        status: string;
        deferralEndDate: Date | null;
        lastDonationAt: Date | null;
        gender: string;
    }): DonorDetailRow['eligibility'] {
        const now = Date.now();
        if (donor.status === DonorStatus.INACTIVE && donor.deferralEndDate === null) {
            return { eligible: false, reason: 'Donor has a permanent exclusion.', eligibleAt: null };
        }
        if (donor.deferralEndDate !== null && donor.deferralEndDate.getTime() > now) {
            return {
                eligible: false,
                reason: `Donor is in deferral until ${donor.deferralEndDate.toISOString()}.`,
                eligibleAt: donor.deferralEndDate,
            };
        }
        if (donor.lastDonationAt !== null) {
            const intervalInDays = donor.gender === 'MALE' ? 60 : 90;
            const nextAllowedAt = new Date(
                donor.lastDonationAt.getTime() + intervalInDays * 24 * 60 * 60 * 1000,
            );
            if (nextAllowedAt.getTime() > now) {
                return {
                    eligible: false,
                    reason: `Donor must wait until ${nextAllowedAt.toISOString()} (${intervalInDays} days interval).`,
                    eligibleAt: nextAllowedAt,
                };
            }
        }
        return { eligible: true, eligibleAt: null };
    }
}
