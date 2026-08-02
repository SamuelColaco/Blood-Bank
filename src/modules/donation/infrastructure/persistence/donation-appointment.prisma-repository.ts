import { Injectable } from '@nestjs/common';
import { DonationAppointment } from '../../domain/entities/donation-appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { IDonationAppointmentRepository } from '../../domain/repositories/donation-appointment.repository';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { DonationPrismaService } from './donation-prisma.service';
import { DonationPrismaTransactionRunner } from './transaction-runner';

@Injectable()
export class DonationAppointmentPrismaRepository implements IDonationAppointmentRepository {
    constructor(
        private readonly prisma: DonationPrismaService,
        private readonly transactionRunner: DonationPrismaTransactionRunner,
    ) { }

    async findById(id: string): Promise<DonationAppointment | null> {
        const row = await this.prisma.donationAppointment.findUnique({ where: { id } });
        if (!row) return null;
        return DonationAppointment.restore({
            id: row.id,
            tenantId: row.tenantId,
            donorId: row.donorId,
            scheduledAt: row.scheduledAt,
            status: row.status as AppointmentStatus,
        });
    }

    async findByDonorId(tenantId: string, donorId: string): Promise<DonationAppointment[]> {
        const rows = await this.prisma.donationAppointment.findMany({
            where: { tenantId, donorId },
        });
        return rows.map((row) =>
            DonationAppointment.restore({
                id: row.id,
                tenantId: row.tenantId,
                donorId: row.donorId,
                scheduledAt: row.scheduledAt,
                status: row.status as AppointmentStatus,
            }),
        );
    }

    async save(appointment: DonationAppointment, scope?: ITransactionScope): Promise<void> {
        const client = scope
            ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
            : this.prisma;

        await client.donationAppointment.upsert({
            where: { id: appointment.id },
            create: {
                id: appointment.id,
                tenantId: appointment.tenantId,
                donorId: appointment.donorId,
                scheduledAt: appointment.scheduledAtValue,
                status: appointment.status,
            },
            update: {
                status: appointment.status,
            },
        });
    }
}
