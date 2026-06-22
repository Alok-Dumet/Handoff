import { JourneyConfigSchema } from '@handoff/contracts';

const rawJourneyConfig = {
  version: '2026-06-21',
  defaultJourney: 'pre-check-in',
  journeys: {
    'pre-check-in': {
      type: 'pre-check-in',
      label: 'Pre-check-in',
      path: '/journeys/pre-check-in',
      ctaLabel: 'Start check-in',
      description: 'Confirm trip details before pickup.',
    },
    biometric: {
      type: 'biometric',
      label: 'Biometric verification',
      path: '/journeys/biometric',
      ctaLabel: 'Verify identity',
      description: 'Speed up pickup with identity verification.',
    },
    'e-receipt': {
      type: 'e-receipt',
      label: 'E-receipt',
      path: '/journeys/e-receipt',
      ctaLabel: 'View receipt',
      description: 'Review receipt and rental charges.',
    },
    'vehicle-upgrade': {
      type: 'vehicle-upgrade',
      label: 'Vehicle upgrade',
      path: '/journeys/vehicle-upgrade',
      ctaLabel: 'View upgrades',
      description: 'See eligible upgrade offers for this booking.',
    },
  },
} as const;

export const journeyConfig = JourneyConfigSchema.parse(rawJourneyConfig);
