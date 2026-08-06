import { Injectable } from '@nestjs/common';
import { Donation } from '../../domain/entities/donation.entity';
import { DonationPurpose } from '../../../../shared/domain/donation-purpose.enum';
import { IDonationRepository } from '../../domain/repositories/donation.repository';
import { VitalSigns } from '../../domain/value-objects/vital-signs.vo';
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
            vitalSigns: this.toVitalSigns(row),
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
                vitalSigns: this.toVitalSigns(row),
                vitalSignsRecorded: row.vitalSignsRecorded,
                apheresisSession: row.apheresisSession as any,
                collectedAt: row.collectedAt,
            }),
        );
    }

    private toVitalSigns(row: any): VitalSigns | null {
        if (
            row.weightInKg === null ||
            row.hemoglobinInGdl === null ||
            row.bloodPressureSys === null ||
            row.bloodPressureDia === null
        ) {
            return null;
        }
        return VitalSigns.restore({
            weightInKg: row.weightInKg,
            hemoglobinInGdl: row.hemoglobinInGdl,
            bloodPressureSys: row.bloodPressureSys,
            bloodPressureDia: row.bloodPressureDia,
        });
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
                weightInKg: donation.vitalSigns?.weightInKg ?? null,
                hemoglobinInGdl: donation.vitalSigns?.hemoglobinInGdl ?? null,
                bloodPressureSys: donation.vitalSigns?.bloodPressureSys ?? null,
                bloodPressureDia: donation.vitalSigns?.bloodPressureDia ?? null,
                apheresisSession: donation.apheresisSession as any,
                collectedAt: donation.collectedAt,
            },
            update: {
                questionnaireSnapshot: donation.questionnaireSnapshot as any,
                vitalSignsRecorded: donation.vitalSignsRecorded,
                weightInKg: donation.vitalSigns?.weightInKg ?? null,
                hemoglobinInGdl: donation.vitalSigns?.hemoglobinInGdl ?? null,
                bloodPressureSys: donation.vitalSigns?.bloodPressureSys ?? null,
                bloodPressureDia: donation.vitalSigns?.bloodPressureDia ?? null,
                apheresisSession: donation.apheresisSession as any,
                collectedAt: donation.collectedAt,
            },
        });
    }
}
