import { describe, expect, it } from 'vitest';
import { TransportContainer } from '../../src/modules/distribution/domain/entities/transport-container.entity';
import { TransportTemperatureOutOfRangeDetectedEvent } from '../../src/modules/distribution/domain/events/transport-container.events';

describe('TransportContainer', () => {
  it('records a reading within the safe range without raising an event', () => {
    const container = TransportContainer.start({
      id: 'container-1',
      tenantId: 'tenant-1',
      linkedHospitalRequestId: 'request-1',
      minTemperature: 1,
      maxTemperature: 6,
    });

    container.recordTemperatureReading(4);

    const events = container.pullDomainEvents();
    expect(events).toHaveLength(0);
  });

  it('raises TransportTemperatureOutOfRangeDetected when below min', () => {
    const container = TransportContainer.start({
      id: 'container-2',
      tenantId: 'tenant-1',
      linkedHospitalRequestId: 'request-1',
      minTemperature: 1,
      maxTemperature: 6,
    });

    container.recordTemperatureReading(-2);

    const events = container.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('TransportTemperatureOutOfRangeDetected');
    expect((events[0] as TransportTemperatureOutOfRangeDetectedEvent).reading).toBe(-2);
  });

  it('raises TransportTemperatureOutOfRangeDetected when above max', () => {
    const container = TransportContainer.start({
      id: 'container-3',
      tenantId: 'tenant-1',
      linkedHospitalRequestId: 'request-1',
      minTemperature: 1,
      maxTemperature: 6,
    });

    container.recordTemperatureReading(10);

    const events = container.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('TransportTemperatureOutOfRangeDetected');
    expect((events[0] as TransportTemperatureOutOfRangeDetectedEvent).reading).toBe(10);
  });
});
