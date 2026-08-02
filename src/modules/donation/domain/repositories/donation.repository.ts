import { Donation } from '../entities/donation.entity';

export interface IDonationRepository {
    findById(id: string): Promise<Donation | null>;
    findByDonorId(tenantId: string, donorId: string): Promise<Donation[]>;
    save(donation: Donation): Promise<void>;
}
