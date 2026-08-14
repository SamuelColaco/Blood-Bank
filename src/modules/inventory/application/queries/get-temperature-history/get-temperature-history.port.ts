/**
 * Read model for the temperature chart on the "Equipamentos" screen
 * (GET /inventory/equipment/:id/temperature-readings). A historical series.
 */
export interface TemperatureReadingRow {
    id: string;
    equipmentId: string;
    value: number;
    recordedAt: Date;
}

export interface GetTemperatureHistoryParams {
    equipmentId: string;
    from?: Date;
    to?: Date;
}

export interface IGetTemperatureHistoryQueryPort {
    execute(params: GetTemperatureHistoryParams): Promise<TemperatureReadingRow[]>;
}
