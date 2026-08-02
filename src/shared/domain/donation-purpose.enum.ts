/**
 * Purpose of a donation - carried from Donation & Screening all the way
 * through to BloodComponent in Inventory. This enum lives in shared/domain
 * because both bounded contexts need it, and duplicating string literals
 * would create a silent-coupling risk.
 */
export enum DonationPurpose {
    GENERAL = 'GENERAL',
    AUTOLOGOUS = 'AUTOLOGOUS',
    DIRECTED = 'DIRECTED',
}
