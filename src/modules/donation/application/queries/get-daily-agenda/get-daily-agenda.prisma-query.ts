import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '../../../domain/enums/appointment-status.enum';
import { DonationPrismaService } from '../../../infrastructure/persistence/donation-prisma.service';
import {
    DailyAgendaRow,
    GetDailyAgendaParams,
    IGetDailyAgendaQueryPort,
} from './get-daily-agenda.port';

/**
 * Read-only projection of a single day's donation agenda.
 */
@Injectable()
export class GetDailyAgendaPrismaQuery implements IGetDailyAgendaQueryPort {
    constructor(private readonly prisma: DonationPrismaService) { }

    async execute(params: GetDailyAgendaParams): Promise<DailyAgendaRow[]> {
        const start = new Date(params.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(params.date);
        end.setHours(23, 59, 59, 999);

        const rows = await this.prisma.donationAppointment.findMany({
            where: {
                tenantId: params.tenantId,
                scheduledAt: { gte: start, lte: end },
            },
            include: { donor: true },
            orderBy: { scheduledAt: 'asc' },
        });

        return rows.map((row) => ({
            id: row.id,
            time: row.scheduledAt,
            donorName: row.donor.fullName,
            status: row.status as AppointmentStatus,
        }));
    }
}
