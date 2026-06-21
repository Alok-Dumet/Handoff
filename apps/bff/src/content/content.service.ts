import { Injectable } from '@nestjs/common';
import {
  AemBrandKeySchema,
  AemPageContentSchema,
  type AemPageContent,
} from '@handoff/contracts';
import { AemPageContentAdapter } from './aem-page-content.adapter';

@Injectable()
export class ContentService {
  constructor(private readonly pageContentAdapter: AemPageContentAdapter) {}

  getPageContent(brandKey: string): AemPageContent {
    const config = this.pageContentAdapter.getPageConfig();
    const parsedBrandKey = AemBrandKeySchema.safeParse(brandKey);
    const selectedBrandKey = parsedBrandKey.success
      ? parsedBrandKey.data
      : 'handoff';

    return AemPageContentSchema.parse(config.pages[selectedBrandKey]);
  }
}
