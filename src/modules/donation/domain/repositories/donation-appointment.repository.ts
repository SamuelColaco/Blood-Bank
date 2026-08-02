import { DonationAppointment } from '../entities/donation-appointment.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface IDonationAppointmentRepository {
    findById(id: string): Promise<DonationAppointment | null>;
    findByDonorId(tenantId: string, donorId: string): Promise<DonationAppointment[]>;
    save(appointment: DonationAppointment, scope?: ITransactionScope): Promise<void>;
}
