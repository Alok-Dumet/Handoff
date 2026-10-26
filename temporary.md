# Handoff Current Project Inventory

This document describes what is currently present in the repo, based on the source code. It intentionally avoids the future/target scope in `zdocs`.

## Project Snapshot

- **Name:** Handoff
- **Type:** Vehicle rental / reservation platform
- **Repo structure:** pnpm + Turbo monorepo
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Clerk
- **Backend:** NestJS backend-for-frontend plus NestJS domain services
- **Database:** PostgreSQL through Prisma in the `refdata` service
- **Shared contracts:** Zod schemas and inferred TypeScript types in `libs/contracts`

## Workspace Packages

- `apps/web` - Next.js frontend application.
- `apps/bff` - NestJS backend-for-frontend that fronts the web app and calls downstream services.
- `apps/services/refdata` - NestJS reference-data service backed by PostgreSQL/Prisma.
- `apps/services/reservation` - NestJS reservation service that derives reservation views from bookings and tracks payment state in memory.
- `apps/services/customer` - NestJS customer profile service with seeded/fallback profile data.
- `libs/contracts` - Shared Zod schemas, validation helpers, constants, and TypeScript types.

## Frontend Pages

### `/`

- Landing/home page.
- Shows a full-screen looping car video background.
- Displays the headline: `Your next car, handed off in minutes.`
- Signed-in users are redirected away from this page to `/vehicles` by Clerk middleware.

### `/vehicles`

- Vehicle listing page.
- Fetches vehicle summaries from the BFF using server-side data loading.
- Validates URL filters with `VehicleFilterSchema`.
- Supports vehicle filtering through query params.
- Renders error, empty, and populated list states.
- Displays vehicle cards in a responsive grid.

### `/vehicles/[id]`

- Vehicle detail and reservation/purchase flow page.
- Fetches vehicle detail, locations, add-ons/protection catalog, and rental terms from the BFF.
- Allows pick-up/drop-off location and date/time selection.
- Calls the BFF quote endpoint when a complete rental window is selected.
- Displays a booking summary with vehicle rate, protection plan, add-ons, tax, subtotal, and total.
- Requires both a valid quote and accepted current terms version before enabling the reserve button.
- The reserve button is present, but the visible frontend does not yet submit a completed booking/reservation from this page.

### `/sign-in/[[...sign-in]]`

- Clerk sign-in page.
- Uses custom HandOff sign-in copy and dark theme styling from the root layout.

### `/sign-up/[[...sign-up]]`

- Clerk sign-up page.
- Uses custom HandOff sign-up copy and dark theme styling from the root layout.

## Frontend Components

- `SiteHeader` - Top navigation, logo routing, Clerk login/sign-up links, and signed-in user button.
- `SiteFooter` - Footer branding and placeholder navigation links.
- `VehicleCard` - Vehicle summary card with image, class, price, seats, transmission, pickup location, distance label, and checkout link.
- `VehicleFilters` - Client-side vehicle filter UI with class, transmission, seats, price range, sort, and location autocomplete.
- `RentalWindowPicker` - Pick-up/drop-off location and date/time picker backed by URL query params and shared rental-window validation.
- `PurchaseExtras` - Protection plan selector, add-on selector, rental terms display, and versioned terms acceptance.

## Frontend Data Helpers

`apps/web/src/lib/vehicles.ts` contains frontend-to-BFF functions:

- `getVehicles()` - Fetches filtered vehicle summaries.
- `getVehicle()` - Fetches one vehicle detail by id.
- `getLocations()` - Fetches pickup/drop-off locations.
- `getCatalog()` - Fetches purchase add-ons and protection plans.
- `getTerms()` - Fetches versioned rental terms.
- `getQuote()` - Fetches a server-computed rental quote.
- `geocode()` - Fetches local geocode/autocomplete results from the BFF.

## Backend Services

### BFF Service

Path: `apps/bff`

- Runs as a NestJS backend-for-frontend.
- Default port: `3001`.
- Enables CORS for `WEB_ORIGIN`, defaulting to `http://localhost:3000`.
- Calls downstream services using environment variables:
  - `REFDATA_URL`, default `http://localhost:3002`
  - `CUSTOMER_SERVICE_URL`, default `http://localhost:3003`
  - `RESERVATION_SERVICE_URL`, default `http://localhost:3004`
- Validates upstream/downstream payloads with shared contract schemas.
- Contains modules for vehicles, geocode, locations, pricing, catalog, bookings, journeys, auth, customers, reservations, rentals, and payments.

### Refdata Service

Path: `apps/services/refdata`

- Runs as a NestJS service backed by PostgreSQL through Prisma.
- Default port: `3002`.
- Owns current persistent data for locations, vehicles, and bookings.
- Supports vehicle filtering and booking creation.
- Uses Prisma migrations and seed data.

### Customer Service

Path: `apps/services/customer`

- Runs as a NestJS service.
- Default port: `3003`.
- Provides customer profile lookup by customer id.
- Uses one seeded demo profile and generates a standard fallback profile for unknown ids.
- Does not currently persist customer data in a database.

### Reservation Service

Path: `apps/services/reservation`

- Runs as a NestJS service.
- Default port: `3004`.
- Derives reservation list/detail data from bookings in the refdata service.
- Tracks reservation payment state in an in-memory `Map`.
- Exposes payment-state updates for the BFF payments flow.
- Does not currently persist reservation/payment state to the database.

## BFF Endpoints

Implemented in `apps/bff/src`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `GET` | `/vehicles` | Returns vehicle summaries with filtering/sorting support. |
| `GET` | `/vehicles/:id` | Returns one vehicle detail. |
| `GET` | `/locations` | Returns pickup/drop-off locations. |
| `GET` | `/geocode?q=` | Searches a curated local location list for autocomplete/distance sorting. |
| `GET` | `/quote` | Returns authoritative rental quote totals for a selected vehicle/window/extras. |
| `GET` | `/catalog` | Returns purchase add-ons and protection plans. |
| `GET` | `/terms` | Returns versioned rental terms. |
| `GET` | `/bookings` | Proxies booking list from refdata. |
| `POST` | `/bookings` | Creates a booking through refdata and returns next journey metadata. |
| `GET` | `/auth/session` | Returns current/authenticated session shape. |
| `GET` | `/customers/me` | Returns current customer profile via the customer service. |
| `GET` | `/reservations` | Returns reservation list via the reservation service. |
| `GET` | `/reservations/:id` | Returns reservation detail via the reservation service. |
| `GET` | `/rentals/current` | Returns a current rental projection from reservation data. |
| `POST` | `/payments/reservation-sessions` | Creates a mock Stripe-style reservation payment session. |
| `POST` | `/payments/stripe/webhook` | Handles Stripe-style webhook events and updates reservation payment state. |
| `POST` | `/journeys/resolve` | Resolves the next journey/action for a booking context. |
| `GET` | `/journeys/pre-check-in/:reservationId` | Returns pre-check-in workflow data. |
| `POST` | `/journeys/pre-check-in` | Submits pre-check-in workflow data. |
| `GET` | `/journeys/identity-verification/:reservationId` | Returns identity-verification workflow data. |
| `POST` | `/journeys/identity-verification/start` | Starts identity-verification workflow. |
| `POST` | `/journeys/identity-verification/status` | Updates identity-verification status. |
| `GET` | `/journeys/e-receipt/:reservationId` | Returns e-receipt workflow data. |
| `POST` | `/journeys/e-receipt/delivery-preference` | Updates receipt delivery preference. |
| `GET` | `/journeys/vehicle-upgrade/:reservationId` | Returns vehicle-upgrade workflow data. |
| `POST` | `/journeys/vehicle-upgrade/select` | Selects a vehicle-upgrade offer. |
| `POST` | `/journeys/vehicle-upgrade/confirm` | Confirms a selected vehicle upgrade. |

## Domain Service Endpoints

### Refdata Service

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `GET` | `/vehicles` | Returns vehicles from PostgreSQL with optional filters. |
| `GET` | `/vehicles/:id` | Returns one vehicle with its location. |
| `GET` | `/locations` | Returns all pickup/drop-off locations. |
| `GET` | `/bookings` | Returns the latest bookings. |
| `GET` | `/bookings/:id` | Returns one booking. |
| `POST` | `/bookings` | Creates a booking after vehicle existence and overlap checks. |

### Customer Service

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `GET` | `/customers/:customerId/profile` | Returns a seeded or fallback customer profile. |

### Reservation Service

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `GET` | `/reservations` | Returns reservation list items derived from bookings. |
| `GET` | `/reservations/:id` | Returns reservation detail derived from a booking. |
| `PUT` | `/reservations/:id/payment-state` | Updates in-memory payment state for a reservation. |

## Database Models

Defined in `apps/services/refdata/prisma/schema.prisma`.

### `Location`

- `id`
- `name`
- `address`
- `latitude`
- `longitude`
- Relation: one location has many vehicles.

### `Vehicle`

- `id`
- `make`
- `model`
- `year`
- `class`
- `transmission`
- `seats`
- `pricePerDay`
- `salePricePerDay`
- `locationId`
- Relation: each vehicle belongs to a location.
- Relation: one vehicle has many bookings.
- Index: `locationId`.

### `Booking`

- `id`
- `vehicleId`
- `customerName`
- `customerEmail`
- `startDate`
- `endDate`
- `status`
- `createdAt`
- Purchase-flow fields:
  - `pickupLocationId`
  - `dropoffLocationId`
  - `pickupAt`
  - `dropoffAt`
  - `addOnIds`
  - `protectionPlanId`
  - `acceptedTermsVersion`
  - `subtotalCents`
  - `taxCents`
  - `totalCents`
- Relation: each booking belongs to a vehicle.
- Index: `vehicleId`.

## Database Enums

- `Transmission`
  - `automatic`
  - `manual`
- `VehicleClass`
  - `economy`
  - `compact`
  - `premium`
  - `suv`
- `BookingStatus`
  - `pending`
  - `confirmed`
  - `cancelled`

## Database Migrations

Current migration folders:

- `20260620183521_init_vehicles`
- `20260621170000_add_bookings`
- `20260626183257_add_pickup_locations`
- `20260629181124_add_location_coords`
- `20260630182902_add_vehicle_sale_price`
- `20260813172914_add_booking_reservation_details`

## Seed Data

Defined in `apps/services/refdata/prisma/seed.ts`.

- 4 pickup/drop-off locations:
  - Los Angeles Airport
  - Downtown LA
  - San Francisco Airport
  - San Jose Downtown
- 10 vehicles across economy, compact, premium, and SUV classes.
- Seed script uses idempotent `upsert` calls for locations and vehicles.

## Shared Contracts

Path: `libs/contracts/src`.

Current contract areas:

- `auth` - Auth session shape.
- `bookings` - Booking creation, booking lists, booking details, and booking extras.
- `catalog` - Add-ons, protection plans, purchase catalog, and rental terms.
- `customers` - Customer profile.
- `journeys` - Journey resolution and workflow schemas.
- `pricing` - Quote requests, quote lines, and quote totals.
- `rental-window` - Pick-up/drop-off date/time validation and rental duration helpers.
- `rentals` - Current rental projection.
- `reservations` - Reservation list/detail, payment states, payment sessions, and webhook payloads.
- `vehicles` - Vehicle, location, geocode, summary/detail, and filter schemas.

## Current Purchase/Reservation Capabilities

- Vehicle list and detail pages are implemented.
- Rental window selection is implemented through URL query params.
- Add-on and protection-plan selection are implemented through URL query params.
- Versioned rental terms display and acceptance are implemented.
- Server-side quote calculation is implemented in the BFF.
- Refdata booking creation exists, including overlap checks.
- Refdata also has a `createWithExtras` service method that stores purchase-flow details and server-computed totals, but the current refdata controller only exposes `POST /bookings` for the basic booking create path.
- BFF payment-session and webhook endpoints exist with mock Stripe-style local behavior.
- Reservation/rental projection endpoints exist, but there are no visible frontend pages for reservations, rentals, payments, or journey workflows in the current `apps/web/src/app` tree.

## Current Known Gaps

- No visible frontend page currently submits the vehicle detail page's reserve action.
- No frontend pages currently exist for reservation detail, current rental, payment checkout, or journey workflows.
- Reservation payment state is in memory in the reservation service, not persisted.
- Customer service data is seeded/fallback only, not persisted.
- Purchase catalog and rental terms are static BFF data, not database-backed.
- Geocode is a local curated lookup, not an external geocoding provider.
- No test files were found in the current source tree.
