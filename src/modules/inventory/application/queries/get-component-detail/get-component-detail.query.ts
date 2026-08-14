import { Inject, Injectable } from '@nestjs/common';
import { COMPONENT_DETAIL_QUERY } from '../../tokens';
import {
    ComponentDetailRow,
    GetComponentDetailParams,
    IGetComponentDetailQueryPort,
} from './get-component-detail.port';

/**
 * Screen query: Detalhe do Componente.
 */
@Injectable()
export class GetComponentDetailQuery {
    constructor(
        @Inject(COMPONENT_DETAIL_QUERY)
        private readonly port: IGetComponentDetailQueryPort,
    ) { }

    execute(params: GetComponentDetailParams): Promise<ComponentDetailRow | null> {
        return this.port.execute(params);
    }
}
