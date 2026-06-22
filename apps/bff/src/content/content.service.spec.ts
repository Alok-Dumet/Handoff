import { AemJourneyPageContentAdapter } from './aem-journey-page-content.adapter';
import { AemPageContentAdapter } from './aem-page-content.adapter';
import { ContentService } from './content.service';

const mockAemPageConfig = {
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
      navigation: [{ label: 'HandOff', href: '/brands/handoff' }],
    },
    roadline: {
      brandKey: 'roadline',
      eyebrow: 'Roadline member reservations',
      heading: 'Reserve your roadline',
      intro: 'Pick a vehicle class and keep your post-booking steps moving.',
      recentBookingsHeading: 'Recent roadline reservations',
      recentBookingsEmpty: 'No Roadline reservations yet.',
      recentBookingsError: 'Roadline reservations could not be loaded.',
      navigation: [{ label: 'Roadline', href: '/brands/roadline' }],
    },
  },
} as const;

const mockJourneyPageConfig = {
  source: 'mock-aem',
  version: '2026-06-22',
  pages: {
    'pre-check-in': {
      journey: 'pre-check-in',
      label: 'Pre-check-in',
      heading: 'Confirm trip details',
      intro:
        'Review driver and pickup details before arrival so the counter handoff is faster.',
      body: 'Verify the reservation details, update contact information, and make sure the pickup plan is correct before you arrive.',
      primaryActionLabel: 'Complete pre-check-in',
    },
    biometric: {
      journey: 'biometric',
      label: 'Biometric verification',
      heading: 'Verify identity',
      intro:
        'Complete identity verification before pickup to reduce manual checks at the branch.',
      body: 'Use the provider handoff to finish identity verification, then return here to review the current state.',
      primaryActionLabel: 'Start provider handoff',
    },
    'e-receipt': {
      journey: 'e-receipt',
      label: 'E-receipt',
      heading: 'Review receipt',
      intro:
        'Review rental charges, taxes, and receipt delivery preferences for this reservation.',
      body: 'The receipt reflects the current reservation pricing and can be sent by email or marked for download.',
      primaryActionLabel: 'Update delivery preference',
    },
    'vehicle-upgrade': {
      journey: 'vehicle-upgrade',
      label: 'Vehicle upgrade',
      heading: 'Review upgrade options',
      intro:
        'Compare eligible vehicle upgrades and choose whether to keep or change your reservation class.',
      body: 'Select a higher-tier vehicle option to review the upgrade and confirm the new reservation class.',
      primaryActionLabel: 'Choose upgrade',
    },
  },
} as const;

const pageAdapter: AemPageContentAdapter = {
  getPageConfig: () => mockAemPageConfig,
};

const journeyAdapter: AemJourneyPageContentAdapter = {
  getJourneyPageConfig: () => mockJourneyPageConfig,
};

describe('ContentService', () => {
  it('returns content for a known brand key', () => {
    const service = new ContentService(pageAdapter, journeyAdapter);

    const result = service.getPageContent('roadline');

    expect(result.brandKey).toBe('roadline');
    expect(result.heading).toBe('Reserve your roadline');
  });

  it('falls back to handoff content for an unknown brand key', () => {
    const service = new ContentService(pageAdapter, journeyAdapter);

    const result = service.getPageContent('unknown');

    expect(result.brandKey).toBe('handoff');
    expect(result.heading).toBe('Available vehicles');
  });

  it('returns journey page content for a known journey key', () => {
    const service = new ContentService(pageAdapter, journeyAdapter);

    const result = service.getJourneyPageContent('vehicle-upgrade');

    expect(result.journey).toBe('vehicle-upgrade');
    expect(result.label).toBe('Vehicle upgrade');
    expect(result.primaryActionLabel).toBe('Choose upgrade');
  });

  it('falls back to pre-check-in journey content for an unknown journey key', () => {
    const service = new ContentService(pageAdapter, journeyAdapter);

    const result = service.getJourneyPageContent('unknown');

    expect(result.journey).toBe('pre-check-in');
    expect(result.heading).toBe('Confirm trip details');
  });
});
