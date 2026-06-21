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
      navigation: [
        { label: 'HandOff', href: '/brands/handoff' },
        { label: 'Roadline', href: '/brands/roadline' },
      ],
    },
    roadline: {
      brandKey: 'roadline',
      eyebrow: 'Roadline member reservations',
      heading: 'Reserve your roadline',
      intro: 'Pick a vehicle class and keep your post-booking steps moving.',
      recentBookingsHeading: 'Recent roadline reservations',
      recentBookingsEmpty: 'No Roadline reservations yet.',
      recentBookingsError: 'Roadline reservations could not be loaded.',
      navigation: [
        { label: 'HandOff', href: '/brands/handoff' },
        { label: 'Roadline', href: '/brands/roadline' },
      ],
    },
  },
} as const;

export const mockAemPageConfig =
  AemPageConfigSchema.parse(rawMockAemPageConfig);
