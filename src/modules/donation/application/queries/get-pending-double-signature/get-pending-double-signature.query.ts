import { Inject, Injectable } from '@nestjs/common';
import { DonationTokens } from '../../tokens';
import {
    GetPendingDoubleSignatureParams,
    IGetPendingDoubleSignatureQueryPort,
    PendingDoubleSignatureRow,
} from './get-pending-double-signature.port';

/**
 * Screen query: "Fila de Dupla Assinatura".
 */
@Injectable()
export class GetPendingDoubleSignatureQuery {
    constructor(
        @Inject(DonationTokens.GET_PENDING_DOUBLE_SIGNATURE_QUERY)
        private readonly port: IGetPendingDoubleSignatureQueryPort,
    ) { }

    execute(params: GetPendingDoubleSignatureParams): Promise<PendingDoubleSignatureRow[]> {
        return this.port.execute(params);
    }
}
