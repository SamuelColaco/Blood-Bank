import { describe, expect, it } from 'vitest';
import { HospitalRequest } from '../../src/modules/distribution/domain/entities/hospital-request.entity';
import { HospitalRequestStatus } from '../../src/modules/distribution/domain/enums/hospital-request-status.enum';
import { Urgency } from '../../src/modules/distribution/domain/enums/urgency.enum';
import { BloodType, AboGroup, RhFactor } from '../../src/shared/domain/blood-type.vo';
import { SpecialProcessing } from '../../src/shared/domain/special-processing.vo';
import { DomainError } from '../../src/shared/domain/domain-error';

function buildRequest(urgency: Urgency = Urgency.ELECTIVE): HospitalRequest {
  return HospitalRequest.request({
    id: 'request-1',
    tenantId: 'tenant-1',
    hospitalId: 'hospital-1',
    requestedBloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
    urgency,
  });
}

function matcher() {
  return {
    componentId: 'component-a',
    componentType: 'RED_BLOOD_CELLS',
    bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
    specialProcessing: SpecialProcessing.create(false, false),
    expiresAt: new Date('2026-02-01'),
  };
}

describe('HospitalRequest', () => {
  it('starts in REQUESTED and raises HospitalRequestCreated', () => {
    const request = buildRequest();
    expect(request.status).toBe(HospitalRequestStatus.REQUESTED);
    const events = request.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('HospitalRequestCreated');
  });

  it('follows REQUESTED -> MATCHED -> RESERVED -> CROSSMATCH_CONFIRMED -> ALLOCATED -> DELIVERED', () => {
    const request = buildRequest(Urgency.EMERGENCY);
    request.pullDomainEvents();
    request.match('component-1', []);
    expect(request.status).toBe(HospitalRequestStatus.MATCHED);
    request.reserve();
    expect(request.status).toBe(HospitalRequestStatus.RESERVED);
    request.confirmCrossmatch('xmatch-1', 'dr-smith', 'LAB');
    expect(request.status).toBe(HospitalRequestStatus.CROSSMATCH_CONFIRMED);
    request.allocate();
    expect(request.status).toBe(HospitalRequestStatus.ALLOCATED);
    request.confirmDelivery();
    expect(request.status).toBe(HospitalRequestStatus.DELIVERED);
  });

  it('refuses to confirm crossmatch without a reference', () => {
    const request = buildRequest();
    request.match('component-1', []);
    request.reserve();
    request.pullDomainEvents();
    expect(() => request.confirmCrossmatch('', 'dr-smith', 'LAB')).toThrow(DomainError);
  });

  it('refuses to allocate without a confirmed crossmatch reference', () => {
    const request = buildRequest(Urgency.EMERGENCY);
    request.match('component-1', []);
    request.reserve();
    request.confirmCrossmatch('xmatch-1', 'dr-smith', 'LAB');
    request.pullDomainEvents();
    (request as any)._crossmatchReference = null;
    expect(() => request.allocate()).toThrow(DomainError);
  });

  it('refuses to confirm delivery before allocation', () => {
    const request = buildRequest();
    request.match('component-1', []);
    request.reserve();
    request.pullDomainEvents();
    expect(() => request.confirmDelivery()).toThrow(DomainError);
  });

  it('cancels before allocation and records the reason', () => {
    const request = buildRequest();
    request.match('component-1', []);
    request.reserve();
    request.pullDomainEvents();
    request.cancel('Patient stabilized');
    expect(request.status).toBe(HospitalRequestStatus.CANCELLED);
    expect(request.cancellationReason).toBe('Patient stabilized');
  });

  it('refuses to cancel after allocation', () => {
    const request = buildRequest(Urgency.EMERGENCY);
    request.match('component-1', []);
    request.reserve();
    request.confirmCrossmatch('xmatch-1', 'dr-smith', 'LAB');
    request.allocate();
    request.pullDomainEvents();
    expect(() => request.cancel('Changed plans')).toThrow(DomainError);
  });

  it('records an override-log entry when the auto-pick is overridden', () => {
    const request = buildRequest(Urgency.ELECTIVE);
    request.match('component-a', [matcher(), {
      componentId: 'component-b',
      componentType: 'RED_BLOOD_CELLS',
      bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
      specialProcessing: SpecialProcessing.create(false, false),
      expiresAt: new Date('2026-03-01'),
    }]);
    request.reserve();
    request.overridePick('component-b', 'Prefer fresher unit');
    expect(request.linkedComponentId).toBe('component-b');
    expect(request.overrideLog).toHaveLength(1);
    expect(request.overrideLog[0].chosenComponentId).toBe('component-b');
  });

  it('rejects when no compatible component is available', () => {
    const request = buildRequest();
    request.reject('No compatible component in stock.');
    expect(request.status).toBe(HospitalRequestStatus.REJECTED);
    expect(request.rejectionReason).toBe('No compatible component in stock.');
  });
});
