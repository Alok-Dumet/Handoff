import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
  // Pricing resolves add-on and plan ids through this service.
  exports: [CatalogService],
})
export class CatalogModule {}
