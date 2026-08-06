import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Donor } from '../../src/modules/donation/domain/entities/donor.entity';
import { DonorStatus } from '../../src/modules/donation/domain/enums/donor-status.enum';
import { DomainError } from '../../src/shared/domain/domain-error';

function buildDonor(
  overrides: Partial<{
    gender: 'MALE' | 'FEMALE';
    deferralEndDate: Date | null;
    lastDonationAt: Date | null;
    status: DonorStatus;
  }> = {},
): Donor {
  return Donor.restore({
    id: 'donor-1',
    tenantId: 'tenant-1',
    fullName: 'Jane Doe',
    documentId: 'doc-1',
    birthDate: new Date('1990-01-01'),
    gender: overrides.gender ?? 'FEMALE',
    status: overrides.status ?? DonorStatus.ACTIVE,
    deferralEndDate: overrides.deferralEndDate ?? null,
    lastDonationAt: overrides.lastDonationAt ?? null,
  });
}

describe('Donor', () => {
  beforeEach(() => {
    // Fixed "now" so deferral/interval math does not depend on the clock.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets a concrete deferralEndDate when marked inactive with a temporary deferral', () => {
    const donor = buildDonor();
    donor.markAsInactive(30);
    expect(donor.status).toBe(DonorStatus.INACTIVE);
    expect(donor.deferralEndDate).toEqual(new Date('2026-01-31T00:00:00.000Z'));
  });

  it('leaves deferralEndDate null for a permanent exclusion', () => {
    const donor = buildDonor();
    donor.markAsInactive(null);
    expect(donor.status).toBe(DonorStatus.INACTIVE);
    expect(donor.deferralEndDate).toBeNull();
  });

  it('refuses to reactivate a permanently excluded donor', () => {
    const donor = buildDonor({ status: DonorStatus.INACTIVE, deferralEndDate: null });
    expect(() => donor.reactivate()).toThrow(DomainError);
  });

  it('refuses to reactivate a donor still inside the deferral window', () => {
    const donor = buildDonor({
      status: DonorStatus.INACTIVE,
      deferralEndDate: new Date('2026-01-15T00:00:00.000Z'),
    });
    expect(() => donor.reactivate()).toThrow(DomainError);
  });

  it('reactivates a donor once the deferral window has passed, clearing deferralEndDate', () => {
    const donor = buildDonor({
      status: DonorStatus.INACTIVE,
      deferralEndDate: new Date('2025-12-15T00:00:00.000Z'),
    });
    donor.reactivate();
    expect(donor.status).toBe(DonorStatus.ACTIVE);
    expect(donor.deferralEndDate).toBeNull();
  });

  it('blocks a male donor within the 60-day routine interval', () => {
    const donor = buildDonor({
      gender: 'MALE',
      status: DonorStatus.ACTIVE,
      lastDonationAt: new Date('2025-12-01T00:00:00.000Z'),
    });
    const result = donor.isEligibleToDonate();
    expect(result.eligible).toBe(false);
    expect(result.eligibleAt).toBeDefined();
  });

  it('allows a male donor after the 60-day routine interval', () => {
    const donor = buildDonor({
      gender: 'MALE',
      status: DonorStatus.ACTIVE,
      lastDonationAt: new Date('2025-10-01T00:00:00.000Z'),
    });
    expect(donor.isEligibleToDonate().eligible).toBe(true);
  });

  it('still blocks a female donor at 60 days but allows her at 90 days', () => {
    const donorAt60Days = buildDonor({
      gender: 'FEMALE',
      status: DonorStatus.ACTIVE,
      lastDonationAt: new Date('2025-11-02T00:00:00.000Z'),
    });
    expect(donorAt60Days.isEligibleToDonate().eligible).toBe(false);

    const donorAt90Days = buildDonor({
      gender: 'FEMALE',
      status: DonorStatus.ACTIVE,
      lastDonationAt: new Date('2025-10-03T00:00:00.000Z'),
    });
    expect(donorAt90Days.isEligibleToDonate().eligible).toBe(true);
  });

  it('blocks a donor still in deferral even if the routine interval is met', () => {
    const donor = buildDonor({
      status: DonorStatus.INACTIVE,
      deferralEndDate: new Date('2026-01-15T00:00:00.000Z'),
      lastDonationAt: new Date('2025-01-01T00:00:00.000Z'),
    });
    const result = donor.isEligibleToDonate();
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('deferral');
  });

  it('is eligible when active with no prior donation', () => {
    expect(buildDonor().isEligibleToDonate().eligible).toBe(true);
  });
});