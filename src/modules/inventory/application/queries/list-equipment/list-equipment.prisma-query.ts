import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    EquipmentRow,
    EquipmentStatus,
    IListEquipmentQueryPort,
    ListEquipmentParams,
} from './list-equipment.port';

/**
 * Read-only projection listing equipment with their latest temperature
 * reading and a derived current status against the safe range.
 */
@Injectable()
export class ListEquipmentPrismaQuery implements IListEquipmentQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: ListEquipmentParams): Promise<EquipmentRow[]> {
        const rows = await this.prisma.equipment.findMany({
            where: { tenantId: params.tenantId },
            include: {
                temperatureReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
            },
            orderBy: { id: 'asc' },
        });

        return rows.map((row) => {
            const last = row.temperatureReadings[0] ?? null;
            let status: EquipmentStatus = 'NO_READING';
            if (last) {
                status =
                    last.value >= row.minTemperature && last.value <= row.maxTemperature
                        ? 'OK'
                        : 'WARNING';
            }
            return {
                id: row.id,
                tenantId: row.tenantId,
                equipmentType: row.equipmentType,
                minTemperature: row.minTemperature,
                maxTemperature: row.maxTemperature,
                status,
                lastReading: last ? { value: last.value, recordedAt: last.recordedAt } : null,
            };
        });
    }
}
