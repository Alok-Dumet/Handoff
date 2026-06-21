jest.mock('@handoff/contracts', () => ({
  ResolveJourneyResponseSchema: { parse: (value: unknown) => value },
}));

import { JourneyContentAdapter } from './content/journey-content.adapter';
import { JourneysService } from './journeys.service';

const mockAemJourneyConfig = {
  source: 'mock-aem',
  version: '2026-06-21',
  defaultJourney: 'pre-check-in',
  journeys: {
    'pre-check-in': {
      type: 'pre-check-in',
      label: 'Pre-check-in',
      path: '/journeys/pre-check-in',
      ctaLabel: 'Start check-in',
    },
    biometric: {
      type: 'biometric',
      label: 'Biometric verification',
      path: '/journeys/biometric',
      ctaLabel: 'Verify identity',
    },
    'e-receipt': {
      type: 'e-receipt',
      label: 'E-receipt',
      path: '/journeys/e-receipt',
      ctaLabel: 'View receipt',
    },
    'vehicle-upgrade': {
      type: 'vehicle-upgrade',
      label: 'Vehicle upgrade',
      path: '/journeys/vehicle-upgrade',
      ctaLabel: 'View upgrades',
    },
  },
} as const;

const adapter: JourneyContentAdapter = {
  getJourneyConfig: () => mockAemJourneyConfig,
};

const baseRequest = {
  bookingId: 'booking_123',
  vehicleId: 'veh_001',
  customerEmail: 'demo@example.com',
  bookingStatus: 'pending' as const,
  signals: {
    checkedInEligible: false,
    biometricEligible: false,
    receiptAvailable: false,
    upgradeAvailable: false,
  },
};

describe('JourneysService', () => {
  it('resolves pre-check-in when check-in is eligible', () => {
    const service = new JourneysService(adapter);

    const result = service.resolve({
      ...baseRequest,
      signals: { ...baseRequest.signals, checkedInEligible: true },
    });

    expect(result.nextJourney.type).toBe('pre-check-in');
    expect(result.alternatives).toHaveLength(3);
  });

  it('resolves biometric before upgrade and check-in', () => {
    const service = new JourneysService(adapter);

    const result = service.resolve({
      ...baseRequest,
      signals: {
        ...baseRequest.signals,
        checkedInEligible: true,
        biometricEligible: true,
        upgradeAvailable: true,
      },
    });

    expect(result.nextJourney.type).toBe('biometric');
  });

  it('resolves vehicle upgrade when upgrade is the highest eligible signal', () => {
    const service = new JourneysService(adapter);

    const result = service.resolve({
      ...baseRequest,
      signals: { ...baseRequest.signals, upgradeAvailable: true },
    });

    expect(result.nextJourney.type).toBe('vehicle-upgrade');
  });

  it('resolves e-receipt for non-pending bookings when a receipt is available', () => {
    const service = new JourneysService(adapter);

    const result = service.resolve({
      ...baseRequest,
      bookingStatus: 'confirmed',
      signals: { ...baseRequest.signals, receiptAvailable: true },
    });

    expect(result.nextJourney.type).toBe('e-receipt');
  });

  it('falls back to the configured default journey', () => {
    const service = new JourneysService(adapter);

    const result = service.resolve(baseRequest);

    expect(result.nextJourney.type).toBe(mockAemJourneyConfig.defaultJourney);
  });
});
