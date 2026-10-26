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
 * These catalogs remain static configuration for the demo.
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
  version: '2026-10-27',
  summary:
    'This is a demo rental. Reserving saves your selected car, times, extras, and quoted total. No payment is collected.',
  sections: [
    {
      heading: 'Pick-up and return',
      body: 'Pick up and return the car at its listed branch. All times shown are UTC. Rentals last between one hour and 90 days, with partial days billed as full days in the quote.',
    },
    {
      heading: 'Availability',
      body: 'Your reservation is confirmed when you receive a booking reference. The scheduled return counts as the return in this demo, followed by a 24-hour preparation period before the next rental.',
    },
    {
      heading: 'Demo reservations',
      body: 'Prices, optional extras, and protection plans illustrate a rental booking; they do not purchase real vehicles, equipment, or insurance. Cancellation, extensions, and payment collection are not offered.',
    },
  ],
});
