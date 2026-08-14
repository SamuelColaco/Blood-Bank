import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import {
    GetTemperatureHistoryParams,
    IGetTemperatureHistoryQueryPort,
    TemperatureReadingRow,
} from './get-temperature-history.port';

/**
 * Read-only projection of an equipment's temperature reading series.
 */
@Injectable()
export class GetTemperatureHistoryPrismaQuery implements IGetTemperatureHistoryQueryPort {
    constructor(private readonly prisma: PrismaService) { }

    async execute(params: GetTemperatureHistoryParams): Promise<TemperatureReadingRow[]> {
        const rows = await this.prisma.temperatureReading.findMany({
            where: {
                equipmentId: params.equipmentId,
                ...(params.from || params.to
                    ? {
                        recordedAt: {
                            ...(params.from ? { gte: params.from } : {}),
                            ...(params.to ? { lte: params.to } : {}),
                        },
                    }
                    : {}),
            },
            orderBy: { recordedAt: 'asc' },
        });

        return rows.map((row) => ({
            id: row.id,
            equipmentId: row.equipmentId,
            value: row.value,
            recordedAt: row.recordedAt,
        }));
    }
}
