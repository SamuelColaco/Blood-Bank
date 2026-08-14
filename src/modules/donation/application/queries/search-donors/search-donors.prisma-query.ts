import { Injectable } from '@nestjs/common';
import { DonorStatus } from '../../../domain/enums/donor-status.enum';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    ISearchDonorsQueryPort,
    SearchDonorRow,
    SearchDonorsParams,
} from './search-donors.port';

/**
 * Read-only Prisma implementation of the donor search. Pure projection -
 * no aggregate reconstruction, no outbox writes.
 */
@Injectable()
export class SearchDonorsPrismaQuery implements ISearchDonorsQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: SearchDonorsParams): Promise<SearchDonorRow[]> {
        const trimmed = params.query.trim();
        const rows = await this.prisma.donor.findMany({
            where: {
                tenantId: params.tenantId,
                OR: [
                    { fullName: { contains: trimmed, mode: 'insensitive' } },
                    { documentId: { contains: trimmed, mode: 'insensitive' } },
                ],
            },
            orderBy: { fullName: 'asc' },
            take: 50,
        });

        return rows.map((row) => ({
            id: row.id,
            name: row.fullName,
            document: row.documentId,
            // Donor aggregate has no blood type today - see port docblock.
            bloodType: null,
            status: row.status as DonorStatus,
            deferralEndDate: row.deferralEndDate,
        }));
    }
}
