# @handoff/web

Next.js frontend for Handoff.

React and Tailwind CSS frontend with local cookie-based authentication. The vehicle listing
and quote pages fetch data from the BFF using Server Components.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
```

From the repo root, prefer:

```bash
pnpm --filter @handoff/web <script>
```

## Environment

`BFF_URL` controls the server-side URL used by the web app. It defaults to `http://localhost:3001`.

Browser requests (including location search and auth) use the same-origin `/api`
rewrite. Set `BFF_URL` before building if the API uses another host/port.
No authentication provider keys are required. `NEXT_PUBLIC_BFF_URL` and old Clerk
variables are unused. See `.env.example` for the only frontend configuration.
See the root README for database and backend startup.

## Structure

- `src/app/page.tsx` - landing page.
- `src/app/vehicles/page.tsx` - date-based availability search and filters.
- `src/app/vehicles/[id]/page.tsx` - rental quote, add-ons, terms, and checkout.
- `src/app/bookings/[id]/confirmation/page.tsx` - owner-only saved confirmation.
- `src/app/bookings/page.tsx` - private history cards with older-page navigation.
- `src/app/bookings/[id]/page.tsx` - private rental details and saved receipt.
- `src/app/sign-in` and `src/app/sign-up` - local account forms.
- `src/app/account` - private account details; redirects guests to sign-in.
- `src/lib/session.ts` - server-side, no-store session lookup.
- `src/components/VehicleCard.tsx` - presentational vehicle card.

Checkout preserves selections through login/registration. A shared pending state
prevents submission while dates/extras are repriced. Request keys persist in the
tab's session storage so a lost response can be retried after reload without a
duplicate booking. The API remains authoritative for ownership, availability,
price, and retries. All times are UTC and rentals return to their pickup branch.
History and confirmation share `BookingReceipt`; `RentalStatus` derives lifecycle
from UTC dates and updates while the page is open. Authenticated server requests
are uncached, preserve the requested page through login, and distinguish missing
records from service errors. `EmailDeliveryStatus` polls the owner-only delivery
endpoint until sent (or no email was requested for a legacy record), and explains
delays without implying the booking failed. `DEMO_INBOX_URL` controls the local
inbox link; it defaults to `http://localhost:8025` in development and is unset by
default in production. Public deployments should leave it unset unless the inbox
is separately protected.

Run `pnpm test:history` from the root for the maintained browser regression. See
the root README for browser installation and process/port requirements.
