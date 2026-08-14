import { Injectable } from '@nestjs/common';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    DonationDetailRow,
    GetDonationDetailParams,
    IGetDonationDetailQueryPort,
} from './get-donation-detail.port';

/**
 * Read-only projection of a single donation's full snapshot.
 */
@Injectable()
export class GetDonationDetailPrismaQuery implements IGetDonationDetailQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetDonationDetailParams): Promise<DonationDetailRow | null> {
        const row = await this.prisma.donation.findFirst({
            where: { id: params.donationId, tenantId: params.tenantId },
            include: { donor: true },
        });
        if (!row) return null;

        const snapshot = row.questionnaireSnapshot as {
            questionnaireVersionId: string;
            answeredAt: Date;
            answers: { questionId: string; questionTextAtTheTime: string; answer: boolean }[];
        } | null;

        const vital = (row.weightInKg !== null &&
            row.hemoglobinInGdl !== null &&
            row.bloodPressureSys !== null &&
            row.bloodPressureDia !== null);

        return {
            id: row.id,
            tenantId: row.tenantId,
            donorId: row.donorId,
            donorName: row.donor.fullName,
            donorGender: row.donor.gender as 'MALE' | 'FEMALE',
            appointmentId: row.appointmentId,
            donationType: row.donationType as 'WHOLE_BLOOD' | 'APHERESIS',
            donationPurpose: row.donationPurpose as 'GENERAL' | 'AUTOLOGOUS' | 'DIRECTED',
            designatedRecipientId: row.designatedRecipientId,
            questionnaire: snapshot
                ? {
                    questionnaireVersionId: snapshot.questionnaireVersionId,
                    answeredAt: snapshot.answeredAt,
                    answers: snapshot.answers,
                }
                : null,
            vitalSigns: vital
                ? {
                    weightInKg: row.weightInKg!,
                    hemoglobinInGdl: row.hemoglobinInGdl!,
                    bloodPressureSys: row.bloodPressureSys!,
                    bloodPressureDia: row.bloodPressureDia!,
                }
                : null,
            apheresisSession: row.apheresisSession as DonationDetailRow['apheresisSession'],
            collectedAt: row.collectedAt,
            createdAt: row.createdAt,
        };
    }
}
