import { TransportContainer } from '../entities/transport-container.entity';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';

export interface ITransportContainerRepository {
  findById(id: string): Promise<TransportContainer | null>;
  save(container: TransportContainer, scope?: ITransactionScope): Promise<void>;
  /** Persists a temperature reading traceability row - never touches the aggregate. */
  saveTemperatureReading(
    containerId: string,
    value: number,
    scope?: ITransactionScope,
  ): Promise<void>;
}
