jest.mock('@handoff/contracts', () => ({
  AemBrandKeySchema: {
    safeParse: (value: unknown) =>
      value === 'handoff' || value === 'roadline'
        ? { success: true, data: value }
        : { success: false },
  },
  AemPageContentSchema: { parse: (value: unknown) => value },
}));

import { AemPageContentAdapter } from './aem-page-content.adapter';
import { ContentService } from './content.service';

const mockAemPageConfig = {
  source: 'mock-aem',
  version: '2026-06-21',
  pages: {
    handoff: {
      brandKey: 'handoff',
      heading: 'Available vehicles',
      navigation: [{ label: 'HandOff', href: '/brands/handoff' }],
    },
    roadline: {
      brandKey: 'roadline',
      heading: 'Reserve your roadline',
      navigation: [{ label: 'Roadline', href: '/brands/roadline' }],
    },
  },
} as const;

const adapter: AemPageContentAdapter = {
  getPageConfig: () => mockAemPageConfig,
};

describe('ContentService', () => {
  it('returns content for a known brand key', () => {
    const service = new ContentService(adapter);

    const result = service.getPageContent('roadline');

    expect(result.brandKey).toBe('roadline');
    expect(result.heading).toBe('Reserve your roadline');
  });

  it('falls back to handoff content for an unknown brand key', () => {
    const service = new ContentService(adapter);

    const result = service.getPageContent('unknown');

    expect(result.brandKey).toBe('handoff');
    expect(result.heading).toBe('Available vehicles');
  });
});
