import { Controller, Get } from '@nestjs/common';
import { type PurchaseCatalog, type RentalTerms } from '@handoff/contracts';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('catalog')
  getCatalog(): PurchaseCatalog {
    return this.catalogService.getCatalog();
  }

  @Get('terms')
  getTerms(): RentalTerms {
    return this.catalogService.getTerms();
  }
}
