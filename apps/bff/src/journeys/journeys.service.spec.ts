jest.mock('@handoff/contracts', () => ({
  IdentityVerificationWorkflowSchema: { parse: (value: unknown) => value },
  PreCheckInWorkflowSchema: { parse: (value: unknown) => value },
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

  it('returns a default pre-check-in workflow before submission', () => {
    const service = new JourneysService(adapter);

    const result = service.getPreCheckIn('booking_123');

    expect(result).toMatchObject({
      type: 'pre-check-in',
      reservationId: 'booking_123',
      status: 'not_started',
      pickup: {
        locationName: 'Downtown branch',
        time: '09:00',
      },
    });
  });

  it('stores completed pre-check-in workflow state after submission', () => {
    const service = new JourneysService(adapter);

    const submitted = service.submitPreCheckIn({
      reservationId: 'booking_123',
      driver: {
        fullName: 'Demo Customer',
        email: 'demo@example.com',
        phone: '555-0199',
      },
      pickup: {
        locationName: 'Airport branch',
        date: '2026-07-01',
        time: '10:30',
      },
      trip: {
        flightNumber: 'HA123',
        notes: 'Arriving with two bags.',
      },
    });
    const stored = service.getPreCheckIn('booking_123');

    expect(submitted.status).toBe('completed');
    expect(submitted.completedAt).toEqual(expect.any(String));
    expect(stored).toEqual(submitted);
  });

  it('returns a default identity verification workflow before provider handoff', () => {
    const service = new JourneysService(adapter);

    const result = service.getIdentityVerification('booking_123');

    expect(result).toMatchObject({
      type: 'biometric',
      reservationId: 'booking_123',
      status: 'not_started',
      provider: 'mock-identity-provider',
    });
    expect(result.updatedAt).toEqual(expect.any(String));
  });

  it('creates a provider-style identity handoff', () => {
    const service = new JourneysService(adapter);

    const result = service.startIdentityVerification('booking_123');

    expect(result).toMatchObject({
      status: 'handoff_created',
      providerReference: 'idv_mock_booking_123',
      handoffUrl: 'https://identity.local/handoff/idv_mock_booking_123',
    });
  });

  it('stores identity verification status updates', () => {
    const service = new JourneysService(adapter);

    service.startIdentityVerification('booking_123');
    const updated = service.updateIdentityVerificationStatus(
      'booking_123',
      'verified',
    );
    const stored = service.getIdentityVerification('booking_123');

    expect(updated.status).toBe('verified');
    expect(updated.message).toContain('complete');
    expect(stored).toEqual(updated);
  });
});
