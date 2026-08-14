import { Inject, Injectable } from '@nestjs/common';
import { LIST_EQUIPMENT_QUERY } from '../../tokens';
import {
    EquipmentRow,
    IListEquipmentQueryPort,
    ListEquipmentParams,
} from './list-equipment.port';

/**
 * Screen query: Equipamentos.
 */
@Injectable()
export class ListEquipmentQuery {
    constructor(
        @Inject(LIST_EQUIPMENT_QUERY) private readonly port: IListEquipmentQueryPort,
    ) { }

    execute(params: ListEquipmentParams): Promise<EquipmentRow[]> {
        return this.port.execute(params);
    }
}
