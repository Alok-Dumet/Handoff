jest.mock('@handoff/contracts', () => ({
  EReceiptWorkflowSchema: { parse: (value: unknown) => value },
  IdentityVerificationWorkflowSchema: { parse: (value: unknown) => value },
  JourneyConfigSchema: { parse: (value: unknown) => value },
  PreCheckInWorkflowSchema: { parse: (value: unknown) => value },
  ResolveJourneyResponseSchema: { parse: (value: unknown) => value },
  VehicleListSchema: { parse: (value: unknown) => value },
  VehicleSchema: { parse: (value: unknown) => value },
  VehicleUpgradeWorkflowSchema: { parse: (value: unknown) => value },
}));

import { JourneysService } from './journeys.service';

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
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves pre-check-in when check-in is eligible', () => {
    const service = new JourneysService();

    const result = service.resolve({
      ...baseRequest,
      signals: { ...baseRequest.signals, checkedInEligible: true },
    });

    expect(result.nextJourney.type).toBe('pre-check-in');
    expect(result.alternatives).toHaveLength(3);
  });

  it('resolves biometric before upgrade and check-in', () => {
    const service = new JourneysService();

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
    const service = new JourneysService();

    const result = service.resolve({
      ...baseRequest,
      signals: { ...baseRequest.signals, upgradeAvailable: true },
    });

    expect(result.nextJourney.type).toBe('vehicle-upgrade');
  });

  it('resolves e-receipt for non-pending bookings when a receipt is available', () => {
    const service = new JourneysService();

    const result = service.resolve({
      ...baseRequest,
      bookingStatus: 'confirmed',
      signals: { ...baseRequest.signals, receiptAvailable: true },
    });

    expect(result.nextJourney.type).toBe('e-receipt');
  });

  it('falls back to the configured default journey', () => {
    const service = new JourneysService();

    const result = service.resolve(baseRequest);

    expect(result.nextJourney.type).toBe('pre-check-in');
  });

  it('returns a default pre-check-in workflow before submission', () => {
    const service = new JourneysService();

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
    const service = new JourneysService();

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
    const service = new JourneysService();

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
    const service = new JourneysService();

    const result = service.startIdentityVerification('booking_123');

    expect(result).toMatchObject({
      status: 'handoff_created',
      providerReference: 'idv_mock_booking_123',
      handoffUrl: 'https://identity.local/handoff/idv_mock_booking_123',
    });
  });

  it('stores identity verification status updates', () => {
    const service = new JourneysService();

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

  it('builds an itemized e-receipt workflow from reservation and vehicle data', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reservations/booking_123')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'booking_123',
              vehicleId: 'veh_001',
              customerName: 'Demo Customer',
              customerEmail: 'demo@example.com',
              startDate: '2026-06-21',
              endDate: '2026-06-23',
              status: 'confirmed',
              paymentState: 'paid',
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'veh_001',
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            pricePerDay: 42,
          }),
      });
    });

    const service = new JourneysService();
    const result = await service.getEReceipt('booking_123');

    expect(result).toMatchObject({
      type: 'e-receipt',
      reservationId: 'booking_123',
      status: 'sent',
      deliveryPreference: 'email',
      deliveryEmail: 'demo@example.com',
      receiptNumber: 'rcpt_booking_123',
      subtotalCents: 8400,
      taxCents: 1008,
      totalCents: 9408,
      lineItems: [
        { label: '2024 Toyota Corolla', amountCents: 8400 },
        { label: 'Taxes and fees', amountCents: 1008 },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3002/vehicles/veh_001',
    );
  });

  it('updates e-receipt delivery preference to download', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reservations/booking_123')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'booking_123',
              vehicleId: 'veh_001',
              customerName: 'Demo Customer',
              customerEmail: 'demo@example.com',
              startDate: '2026-06-21',
              endDate: '2026-06-23',
              status: 'confirmed',
              paymentState: 'paid',
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'veh_001',
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            pricePerDay: 42,
          }),
      });
    });

    const service = new JourneysService();
    const result = await service.updateEReceiptDeliveryPreference({
      reservationId: 'booking_123',
      deliveryPreference: 'download',
    });

    expect(result.status).toBe('ready');
    expect(result.deliveryPreference).toBe('download');
    expect(result.message).toBe('Receipt ready for download.');
  });

  it('preserves reservation upstream errors for e-receipt workflows', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ message: 'reservation unavailable' }),
    });

    const service = new JourneysService();

    await expect(service.getEReceipt('booking_123')).rejects.toMatchObject({
      response: { message: 'reservation unavailable' },
      status: 503,
    });
  });

  it('preserves refdata upstream errors for e-receipt vehicle lookup', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reservations/booking_123')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'booking_123',
              vehicleId: 'veh_001',
              customerName: 'Demo Customer',
              customerEmail: 'demo@example.com',
              startDate: '2026-06-21',
              endDate: '2026-06-23',
              status: 'confirmed',
              paymentState: 'paid',
            }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ message: 'refdata unavailable' }),
      });
    });

    const service = new JourneysService();

    await expect(service.getEReceipt('booking_123')).rejects.toMatchObject({
      response: { message: 'refdata unavailable' },
      status: 502,
    });
  });

  it('loads vehicle upgrade options and persists the selection', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reservations/booking_123')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'booking_123',
              vehicleId: 'veh_001',
              customerName: 'Demo Customer',
              customerEmail: 'demo@example.com',
              startDate: '2026-06-21',
              endDate: '2026-06-23',
              status: 'confirmed',
              paymentState: 'paid',
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 'veh_001',
              make: 'Toyota',
              model: 'Corolla',
              year: 2024,
              class: 'compact',
              transmission: 'automatic',
              seats: 5,
              pricePerDay: 42,
            },
            {
              id: 'veh_002',
              make: 'Toyota',
              model: 'Camry',
              year: 2026,
              class: 'premium',
              transmission: 'automatic',
              seats: 5,
              pricePerDay: 58,
            },
            {
              id: 'veh_003',
              make: 'Toyota',
              model: 'Highlander',
              year: 2026,
              class: 'suv',
              transmission: 'automatic',
              seats: 7,
              pricePerDay: 74,
            },
          ]),
      });
    });

    const service = new JourneysService();
    const initial = await service.getVehicleUpgrade('booking_123');

    expect(initial.type).toBe('vehicle-upgrade');
    expect(initial.reservationId).toBe('booking_123');
    expect(initial.status).toBe('not_started');
    expect(initial.currentVehicle.vehicleId).toBe('veh_001');
    expect(initial.currentVehicle.title).toBe('2024 Toyota Corolla');
    expect(initial.offers).toHaveLength(2);
    expect(initial.offers[0]).toMatchObject({
      vehicleId: 'veh_002',
      deltaPerDayCents: 1600,
    });
    expect(initial.offers[1]).toMatchObject({
      vehicleId: 'veh_003',
      deltaPerDayCents: 3200,
    });

    const selected = await service.selectVehicleUpgrade({
      reservationId: 'booking_123',
      vehicleId: 'veh_002',
    });
    const confirmed = await service.confirmVehicleUpgrade('booking_123');

    expect(selected.status).toBe('reviewing');
    expect(selected.selectedVehicleId).toBe('veh_002');
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.selectedOffer?.vehicleId).toBe('veh_002');
    expect(confirmed.confirmedAt).toEqual(expect.any(String));
  });

  it('preserves refdata upstream errors for vehicle upgrade options', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reservations/booking_123')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'booking_123',
              vehicleId: 'veh_001',
              customerName: 'Demo Customer',
              customerEmail: 'demo@example.com',
              startDate: '2026-06-21',
              endDate: '2026-06-23',
              status: 'confirmed',
              paymentState: 'paid',
            }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ message: 'refdata unavailable' }),
      });
    });

    const service = new JourneysService();

    await expect(
      service.getVehicleUpgrade('booking_123'),
    ).rejects.toMatchObject({
      response: { message: 'refdata unavailable' },
      status: 503,
    });
  });

  it('throws not found for missing vehicle upgrade offers', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/reservations/booking_123')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'booking_123',
              vehicleId: 'veh_001',
              customerName: 'Demo Customer',
              customerEmail: 'demo@example.com',
              startDate: '2026-06-21',
              endDate: '2026-06-23',
              status: 'confirmed',
              paymentState: 'paid',
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 'veh_001',
              make: 'Toyota',
              model: 'Corolla',
              year: 2024,
              class: 'compact',
              transmission: 'automatic',
              seats: 5,
              pricePerDay: 42,
            },
          ]),
      });
    });

    const service = new JourneysService();

    await expect(
      service.selectVehicleUpgrade({
        reservationId: 'booking_123',
        vehicleId: 'missing',
      }),
    ).rejects.toMatchObject({
      response: { message: 'Vehicle upgrade offer not found' },
      status: 404,
    });
  });
});
