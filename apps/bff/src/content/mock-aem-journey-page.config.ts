import { AemJourneyPageConfigSchema } from '@handoff/contracts';

const rawMockAemJourneyPageConfig = {
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

export const mockAemJourneyPageConfig = AemJourneyPageConfigSchema.parse(
  rawMockAemJourneyPageConfig,
);
