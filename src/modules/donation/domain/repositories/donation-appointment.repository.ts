import { DonationAppointment } from '../entities/donation-appointment.entity';

export interface IDonationAppointmentRepository {
    findById(id: string): Promise<DonationAppointment | null>;
    findByDonorId(tenantId: string, donorId: string): Promise<DonationAppointment[]>;
    save(appointment: DonationAppointment): Promise<void>;
}
