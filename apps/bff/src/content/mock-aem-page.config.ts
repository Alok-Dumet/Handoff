import { AemPageConfigSchema } from '@handoff/contracts';

const rawMockAemPageConfig = {
  source: 'mock-aem',
  version: '2026-06-21',
  pages: {
    handoff: {
      brandKey: 'handoff',
      eyebrow: 'Customer journey demo',
      heading: 'Available vehicles',
      intro: 'Choose a vehicle and reserve it for your next trip.',
      recentBookingsHeading: 'Recent bookings',
      recentBookingsEmpty: 'No bookings yet.',
      recentBookingsError: 'Could not load bookings.',
      navigation: [{ label: 'Vehicles', href: '/vehicles' }],
    },
  },
} as const;

export const mockAemPageConfig =
  AemPageConfigSchema.parse(rawMockAemPageConfig);
