import { Module } from '@nestjs/common';
import { DonationInfrastructureModule } from './infrastructure/donation.infrastructure.module';

/**
 * Donation & Screening bounded context module.
 *
 * Entry point for everything that happens before the blood bag exists
 * as an aggregate in Inventory: donor registration, appointment scheduling,
 * clinical screening, eligibility decision, and the physical collection act.
 * Terminates when DonationCollected is published and Inventory reacts
 * by creating the BloodBag.
 */
@Module({
    imports: [DonationInfrastructureModule],
})
export class DonationModule { }