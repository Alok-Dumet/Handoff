import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [CatalogModule, InventoryModule],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}
