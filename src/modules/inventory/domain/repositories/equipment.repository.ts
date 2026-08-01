import { Equipment } from '../entities/equipment.entity';

export interface IEquipmentRepository {
  findById(id: string): Promise<Equipment | null>;
  save(equipment: Equipment): Promise<void>;
}
