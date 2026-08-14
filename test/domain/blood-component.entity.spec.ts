import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BloodComponent } from '../../src/modules/inventory/domain/entities/blood-component.entity';
import { ComponentType } from '../../src/modules/inventory/domain/enums/component-type.enum';
import { ComponentStatus } from '../../src/modules/inventory/domain/enums/component-status.enum';
import { DiscardReason } from '../../src/modules/inventory/domain/enums/discard-reason.enum';
import { AboGroup, BloodType, RhFactor } from '../../src/shared/domain/blood-type.vo';
import { ValidityPeriod } from '../../src/modules/inventory/domain/value-objects/validity-period.vo';
import { Reservation } from '../../src/modules/inventory/domain/value-objects/reservation.vo';
import { DomainError } from '../../src/shared/domain/domain-error';
import { DonationPurpose } from '../../src/shared/domain/donation-purpose.enum';

function buildFreshComponent(donationPurpose: DonationPurpose = DonationPurpose.GENERAL, designatedRecipientId: string | null = null): BloodComponent {
  return BloodComponent.separate({
    id: 'component-1',
    tenantId: 'tenant-1',
    bloodBagId: 'bag-1',
    componentType: ComponentType.PLATELETS,
    bloodType: BloodType.create(AboGroup.O, RhFactor.NEGATIVE),
    validityPeriod: ValidityPeriod.fromDays(new Date('2026-01-01'), 5),
    donationPurpose,
    designatedRecipientId,
  });
}

describe('BloodComponent', () => {
  beforeEach(() => {
    // Fixed "now" matching the collection date used across these tests,
    // so validity/expiration checks don't depend on the real system clock.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enters quarantine immediately upon separation - there is no path that skips it', () => {
    const component = buildFreshComponent();
    expect(component.status).toBe(ComponentStatus.IN_QUARANTINE);
  });

  it('raises ComponentSeparated and QuarantineStarted events on separation', () => {
    const component = buildFreshComponent();
    const events = component.pullDomainEvents().map((event) => event.eventName);
    expect(events).toEqual(['ComponentSeparated', 'QuarantineStarted']);
  });

  it('moves from IN_QUARANTINE to CLEARED on releaseFromQuarantine', () => {
    const component = buildFreshComponent();
    component.pullDomainEvents();

    component.releaseFromQuarantine();

    expect(component.status).toBe(ComponentStatus.CLEARED);
  });

  it('refuses to release from quarantine twice', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();

    expect(() => component.releaseFromQuarantine()).toThrow(DomainError);
  });

  it('refuses to store a component that has not been cleared yet', () => {
    const component = buildFreshComponent();
    expect(() => component.store('equipment-1')).toThrow(DomainError);
  });

  it('follows the full happy path: quarantine -> cleared -> stored -> reserved -> allocated', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');
    component.reserve(Reservation.emergency('hospital-1', 2));
    component.allocate('xmatch-1');

    expect(component.status).toBe(ComponentStatus.ALLOCATED);
  });

  it('raises ComponentAllocated with the crossmatch reference', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');
    component.reserve(Reservation.emergency('hospital-1', 2));
    component.allocate('xmatch-ref-42');

    const event = component
      .pullDomainEvents()
      .find((e) => e.eventName === 'ComponentAllocated') as unknown as {
        crossmatchReference: string;
      };
    expect(event.crossmatchReference).toBe('xmatch-ref-42');
  });

  it('refuses to allocate without a crossmatch reference', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');
    component.reserve(Reservation.emergency('hospital-1', 2));

    expect(() => component.allocate('   ')).toThrow(DomainError);
    expect(component.status).toBe(ComponentStatus.RESERVED);
  });

  it('refuses to reserve an expired component even though its status is STORED', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');

    // 9 days after separation - platelets have a 5-day validity window.
    vi.setSystemTime(new Date('2026-01-10T00:00:00.000Z'));

    const reservation = Reservation.emergency('hospital-1', 2);
    expect(() => component.reserve(reservation)).toThrow(DomainError);
  });

  it('requires an explicit reason to discard a component', () => {
    const component = buildFreshComponent();
    component.discard(DiscardReason.POSITIVE_SEROLOGY);
    expect(component.status).toBe(ComponentStatus.DISCARDED);
  });

  it('refuses to discard a component twice', () => {
    const component = buildFreshComponent();
    component.discard(DiscardReason.PROCESS_FAILURE);
    expect(() => component.discard(DiscardReason.EXPIRED)).toThrow(DomainError);
  });

  it('flags itself for reevaluation without changing its status (human confirmation still required)', () => {
    const component = buildFreshComponent();
    component.flagForReevaluation();

    expect(component.isUnderReevaluation).toBe(true);
    expect(component.status).toBe(ComponentStatus.IN_QUARANTINE);
  });

  it('refuses to reserve an autologous component for a different recipient', () => {
    const component = buildFreshComponent(DonationPurpose.AUTOLOGOUS, 'recipient-1');
    component.releaseFromQuarantine();
    component.store('equipment-1');

    const reservation = Reservation.emergency('hospital-1', 2);
    expect(() => component.reserve(reservation)).toThrow(DomainError);
  });

  it('allows reserving an autologous component for its designated recipient', () => {
    const component = buildFreshComponent(DonationPurpose.AUTOLOGOUS, 'recipient-1');
    component.releaseFromQuarantine();
    component.store('equipment-1');

    const reservation = Reservation.emergency('recipient-1', 2);
    component.reserve(reservation);

    expect(component.status).toBe(ComponentStatus.RESERVED);
  });

  it('refuses to offer an autologous component for exchange', () => {
    const component = buildFreshComponent(DonationPurpose.AUTOLOGOUS, 'recipient-1');
    component.releaseFromQuarantine();
    component.store('equipment-1');

    expect(() => component.offerForExchange()).toThrow(DomainError);
  });

  it('refuses to offer a directed component for exchange', () => {
    const component = buildFreshComponent(DonationPurpose.DIRECTED, 'recipient-1');
    component.releaseFromQuarantine();
    component.store('equipment-1');

    expect(() => component.offerForExchange()).toThrow(DomainError);
  });

  it('allows offering a general component for exchange', () => {
    const component = buildFreshComponent(DonationPurpose.GENERAL);
    component.releaseFromQuarantine();
    component.store('equipment-1');

    component.offerForExchange();

    expect(component.status).toBe(ComponentStatus.OFFERED_FOR_EXCHANGE);
  });

  it('applies irradiation only to a STORED component and raises its event', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');

    component.applyIrradiation();

    expect(component.specialProcessing.isIrradiated).toBe(true);
    expect(component.specialProcessing.isLeukoreduced).toBe(false);
    expect(
      component.pullDomainEvents().some((e) => e.eventName === 'ComponentIrradiated'),
    ).toBe(true);
  });

  it('refuses to irradiate a component more than once', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');
    component.applyIrradiation();

    expect(() => component.applyIrradiation()).toThrow(DomainError);
  });

  it('refuses to apply irradiation to a non-STORED component', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');
    component.reserve(Reservation.emergency('hospital-1', 2));

    expect(() => component.applyIrradiation()).toThrow(DomainError);
  });

  it('applies leukoreduction only to a STORED component and raises its event', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');

    component.applyLeukoreduction();

    expect(component.specialProcessing.isLeukoreduced).toBe(true);
    expect(component.specialProcessing.isIrradiated).toBe(false);
    expect(
      component.pullDomainEvents().some((e) => e.eventName === 'ComponentLeukoreduced'),
    ).toBe(true);
  });

  it('refuses to apply leukoreduction to an already leukoreduced component', () => {
    const component = buildFreshComponent();
    component.releaseFromQuarantine();
    component.store('equipment-1');
    component.applyLeukoreduction();

    expect(() => component.applyLeukoreduction()).toThrow(DomainError);
  });
});
