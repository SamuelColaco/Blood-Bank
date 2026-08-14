/**
 * Read model for the "Equipamentos" screen (GET /inventory/equipment).
 * Each row is a piece of storage equipment with its latest temperature
 * reading and a current status derived against its safe range.
 */
export type EquipmentStatus = 'OK' | 'WARNING' | 'NO_READING';

export interface EquipmentRow {
    id: string;
    tenantId: string;
    equipmentType: string;
    minTemperature: number;
    maxTemperature: number;
    status: EquipmentStatus;
    lastReading: {
        value: number;
        recordedAt: Date;
    } | null;
}

export interface ListEquipmentParams {
    tenantId: string;
}

export interface IListEquipmentQueryPort {
    execute(params: ListEquipmentParams): Promise<EquipmentRow[]>;
}
