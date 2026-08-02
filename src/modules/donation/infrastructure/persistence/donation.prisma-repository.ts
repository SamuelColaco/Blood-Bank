import { Injectable } from '@nestjs/common';
import { Donation } from '../../domain/entities/donation.entity';
import { DonationPurpose } from '../../../../shared/domain/donation-purpose.enum';
import { IDonationRepository } from '../../domain/repositories/donation.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { DonationPrismaService } from './donation-prisma.service';
import { DonationPrismaTransactionRunner } from './transaction-runner';

@Injectable()
export class DonationPrismaRepository implements IDonationRepository {
    constructor(
        private readonly prisma: DonationPrismaService,
        private readonly transactionRunner: DonationPrismaTransactionRunner,
    ) { }

    async findById(id: string): Promise<Donation | null> {
        const row = await this.prisma.donation.findUnique({ where: { id } });
        if (!row) return null;
        return Donation.restore({
            id: row.id,
            tenantId: row.tenantId,
            donorId: row.donorId,
            appointmentId: row.appointmentId,
            donationType: row.donationType as any,
            donationPurpose: row.donationPurpose as DonationPurpose,
            designatedRecipientId: row.designatedRecipientId,
            questionnaireSnapshot: row.questionnaireSnapshot as any,
            vitalSignsRecorded: row.vitalSignsRecorded,
            apheresisSession: row.apheresisSession as any,
            collectedAt: row.collectedAt,
        });
    }

    async findByDonorId(tenantId: string, donorId: string): Promise<Donation[]> {
        const rows = await this.prisma.donation.findMany({
            where: { tenantId, donorId },
        });
        return rows.map((row) =>
            Donation.restore({
                id: row.id,
                tenantId: row.tenantId,
                donorId: row.donorId,
                appointmentId: row.appointmentId,
                donationType: row.donationType as any,
                donationPurpose: row.donationPurpose as DonationPurpose,
                designatedRecipientId: row.designatedRecipientId,
                questionnaireSnapshot: row.questionnaireSnapshot as any,
                vitalSignsRecorded: row.vitalSignsRecorded,
                apheresisSession: row.apheresisSession as any,
                collectedAt: row.collectedAt,
            }),
        );
    }

    async save(donation: Donation, scope?: ITransactionScope): Promise<void> {
        const client = scope
            ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
            : this.prisma;

        await client.donation.upsert({
            where: { id: donation.id },
            create: {
                id: donation.id,
                tenantId: donation.tenantId,
                donorId: donation.donorId,
                appointmentId: donation.appointmentId,
                donationType: donation.donationType,
                donationPurpose: donation.donationPurpose,
                designatedRecipientId: donation.designatedRecipientId,
                questionnaireSnapshot: donation.questionnaireSnapshot as any,
                vitalSignsRecorded: donation.vitalSignsRecorded,
                apheresisSession: donation.apheresisSession as any,
                collectedAt: donation.collectedAt,
            },
            update: {
                questionnaireSnapshot: donation.questionnaireSnapshot as any,
                vitalSignsRecorded: donation.vitalSignsRecorded,
                apheresisSession: donation.apheresisSession as any,
                collectedAt: donation.collectedAt,
            },
        });
    }
}
