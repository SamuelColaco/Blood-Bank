import { Injectable } from '@nestjs/common';
import { Donor } from '../../domain/entities/donor.entity';
import { IDonorRepository } from '../../domain/repositories/donor.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { DonationPrismaService } from './donation-prisma.service';
import { DonationPrismaTransactionRunner } from './transaction-runner';

@Injectable()
export class DonorPrismaRepository implements IDonorRepository {
    constructor(
        private readonly prisma: DonationPrismaService,
        private readonly transactionRunner: DonationPrismaTransactionRunner,
    ) { }

    async findById(id: string): Promise<Donor | null> {
        const row = await this.prisma.donor.findUnique({ where: { id } });
        if (!row) return null;
        return Donor.restore({
            id: row.id,
            tenantId: row.tenantId,
            fullName: row.fullName,
            documentId: row.documentId,
            birthDate: row.birthDate,
            gender: row.gender as any,
            status: row.status as any,
            deferralEndDate: row.deferralEndDate,
            lastDonationAt: row.lastDonationAt,
        });
    }

    async findByDocumentId(tenantId: string, documentId: string): Promise<Donor | null> {
        const row = await this.prisma.donor.findFirst({ where: { tenantId, documentId } });
        if (!row) return null;
        return Donor.restore({
            id: row.id,
            tenantId: row.tenantId,
            fullName: row.fullName,
            documentId: row.documentId,
            birthDate: row.birthDate,
            gender: row.gender as any,
            status: row.status as any,
            deferralEndDate: row.deferralEndDate,
            lastDonationAt: row.lastDonationAt,
        });
    }

    async save(donor: Donor, scope?: ITransactionScope): Promise<void> {
        const client = scope
            ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
            : this.prisma;

        await client.donor.upsert({
            where: { id: donor.id },
            create: {
                id: donor.id,
                tenantId: donor.tenantId,
                fullName: donor.fullName,
                documentId: donor.documentId,
                birthDate: donor.birthDate,
                gender: donor.gender,
                status: donor.status,
                deferralEndDate: donor.deferralEndDate,
                lastDonationAt: donor.lastDonationAt,
            },
            update: {
                fullName: donor.fullName,
                documentId: donor.documentId,
                birthDate: donor.birthDate,
                gender: donor.gender,
                status: donor.status,
                deferralEndDate: donor.deferralEndDate,
                lastDonationAt: donor.lastDonationAt,
            },
        });
    }
}
