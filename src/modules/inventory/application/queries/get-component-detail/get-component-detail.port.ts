/**
 * Read model for the "Detalhe do Componente" screen
 * (GET /inventory/blood-components/:id). Full component detail including
 * special processing and donation purpose / designated recipient.
 */
export interface ComponentDetailRow {
    id: string;
    tenantId: string;
    bloodBagId: string;
    equipmentId: string | null;
    componentType: string;
    aboGroup: string;
    rhFactor: string;
    extendedPhenotype: string | null;
    status: string;
    collectedAt: Date;
    expiresAt: Date;
    isUnderReevaluation: boolean;
    isIrradiated: boolean;
    isLeukoreduced: boolean;
    donationPurpose: 'GENERAL' | 'AUTOLOGOUS' | 'DIRECTED';
    designatedRecipientId: string | null;
}

export interface GetComponentDetailParams {
    tenantId: string;
    componentId: string;
}

export interface IGetComponentDetailQueryPort {
    execute(params: GetComponentDetailParams): Promise<ComponentDetailRow | null>;
}
