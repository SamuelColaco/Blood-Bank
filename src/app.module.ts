import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/infrastructure/inventory.module';
import { DistributionModule } from './modules/distribution/infrastructure/distribution.module';
import { DonationModule } from './modules/donation/donation.module';

/**
 * Root application module. Each bounded context is wired as its own
 * NestJS module - Doação & Triagem, Distribuição and Rede & Intercâmbio
 * will each get their own module here as their phases are implemented
 * (see docs/roadmap.md).
 */
@Module({
  imports: [InventoryModule, DonationModule, DistributionModule],
})
export class AppModule { }
