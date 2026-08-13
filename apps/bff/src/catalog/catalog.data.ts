import {
  type PurchaseCatalog,
  type RentalTerms,
  PurchaseCatalogSchema,
  RentalTermsSchema,
} from '@handoff/contracts';

/**
 * Static reference data for purchase-page extras.
 *
 * Parsed through the contract at module load, so a malformed catalog fails at
 * boot rather than halfway through rendering a customer's booking summary.
 * When this moves to refdata, only the source of these objects changes.
 */

export const PURCHASE_CATALOG: PurchaseCatalog = PurchaseCatalogSchema.parse({
  addOns: [
    {
      id: 'child_seat_infant',
      label: 'Infant car seat',
      description: 'Rear-facing, for children under 1 year (up to 22 lbs).',
      priceCents: 1200,
      chargeMode: 'per_day',
      maxQuantity: 3,
    },
    {
      id: 'child_seat_toddler',
      label: 'Toddler car seat',
      description: 'Forward-facing, for children 1–4 years (22–40 lbs).',
      priceCents: 1200,
      chargeMode: 'per_day',
      maxQuantity: 3,
    },
    {
      id: 'booster_seat',
      label: 'Booster seat',
      description: 'For children 4–8 years (40–80 lbs).',
      priceCents: 900,
      chargeMode: 'per_day',
      maxQuantity: 3,
    },
    {
      id: 'additional_driver',
      label: 'Additional driver',
      description: 'Let a second licensed driver share the wheel.',
      priceCents: 1500,
      chargeMode: 'per_day',
      maxQuantity: 2,
    },
    {
      id: 'gps',
      label: 'GPS navigation',
      description: 'Dash-mounted unit with offline maps.',
      priceCents: 800,
      chargeMode: 'per_day',
      maxQuantity: 1,
    },
    {
      id: 'prepaid_fuel',
      label: 'Prepaid fuel',
      description: 'Return the car at any fuel level — one flat charge.',
      priceCents: 7500,
      chargeMode: 'flat',
      maxQuantity: 1,
    },
  ],
  protectionPlans: [
    {
      id: 'protection_none',
      label: 'No additional coverage',
      description:
        'You are responsible for the full value of any damage or theft.',
      pricePerDayCents: 0,
      covers: [],
    },
    {
      id: 'protection_basic',
      label: 'Basic protection',
      description: 'Limits your liability for collision damage.',
      pricePerDayCents: 1900,
      covers: ['Collision damage up to $25,000', 'Theft protection'],
    },
    {
      id: 'protection_premium',
      label: 'Premium protection',
      description: 'Zero deductible, plus roadside and personal cover.',
      pricePerDayCents: 3400,
      covers: [
        'Zero deductible on collision damage',
        'Theft protection',
        '24/7 roadside assistance',
        'Personal effects coverage up to $2,000',
      ],
    },
  ],
  // Declining coverage should be a deliberate act, so the cheapest real plan
  // is not preselected — the customer starts on "none" and opts up.
  defaultProtectionPlanId: 'protection_none',
});

export const RENTAL_TERMS: RentalTerms = RentalTermsSchema.parse({
  version: '2026-08-01',
  summary:
    'By reserving, you agree to HandOff’s rental terms, including the ' +
    'driver, fuel, mileage, and cancellation conditions below.',
  sections: [
    {
      heading: 'Driver requirements',
      body:
        'The primary driver must be at least 21 years old and hold a valid ' +
        'driver’s licence held for a minimum of 12 months. Drivers under ' +
        '25 may incur a young-driver surcharge collected at the counter. A ' +
        'credit card in the primary driver’s name is required at pick-up.',
    },
    {
      heading: 'Fuel and mileage',
      body:
        'Vehicles are supplied with a full tank and must be returned full ' +
        'unless prepaid fuel is purchased. Mileage is unlimited within the ' +
        'United States. Refuelling by HandOff is charged at the posted rate ' +
        'plus a service fee.',
    },
    {
      heading: 'Cancellation and no-show',
      body:
        'Reservations may be cancelled free of charge up to 24 hours before ' +
        'the scheduled pick-up. Cancellations inside 24 hours, and no-shows, ' +
        'are charged one rental day. Refunds are returned to the original ' +
        'payment method within 5–10 business days.',
    },
    {
      heading: 'Late return and extensions',
      body:
        'A grace period of 29 minutes applies. Beyond that, each additional ' +
        'hour is charged at one quarter of the daily rate, up to a maximum of ' +
        'one full day. Extensions must be arranged before the scheduled ' +
        'drop-off time.',
    },
    {
      heading: 'Prohibited use',
      body:
        'Vehicles may not be driven outside the United States, used for ' +
        'ride-hailing or delivery services, taken off paved roads, or ' +
        'operated by anyone not listed on the rental agreement. Smoking in ' +
        'the vehicle incurs a cleaning fee.',
    },
  ],
});
