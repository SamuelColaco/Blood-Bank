import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    DailyAgendaRow,
    GetDailyAgendaParams,
    IGetDailyAgendaQueryPort,
} from './get-daily-agenda.port';

/**
 * Screen query: "Agenda do Dia".
 */
@Injectable()
export class GetDailyAgendaQuery {
    constructor(
        @Inject(DonationTokens.GET_DAILY_AGENDA_QUERY)
        private readonly port: IGetDailyAgendaQueryPort,
    ) { }

    execute(params: GetDailyAgendaParams): Promise<DailyAgendaRow[]> {
        return this.port.execute(params);
    }
}
