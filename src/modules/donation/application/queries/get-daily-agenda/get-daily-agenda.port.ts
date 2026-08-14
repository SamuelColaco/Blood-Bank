import { AppointmentStatus } from '../../../domain/enums/appointment-status.enum';

/**
 * Read model for the "Agenda do Dia" screen (GET /donation/appointments).
 * One row per appointment on the requested day, including the donor name.
 */
export interface DailyAgendaRow {
    id: string;
    time: Date;
    donorName: string;
    status: AppointmentStatus;
}

export interface GetDailyAgendaParams {
    tenantId: string;
    date: Date;
}

export interface IGetDailyAgendaQueryPort {
    execute(params: GetDailyAgendaParams): Promise<DailyAgendaRow[]>;
}
