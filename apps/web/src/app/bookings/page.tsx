import Link from "next/link";
import { getBookingHistory } from "@/lib/bookings";
import RentalStatus from "@/components/RentalStatus";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { cursor } = await searchParams;
  const history = await getBookingHistory(cursor);
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-28 text-white">
      <h1 className="text-3xl font-semibold">Your bookings</h1>
      <p className="mt-2 text-white/60">
        Your rental history, newest bookings first. All times are UTC.
      </p>
      {!history ? (
        <p role="alert" className="mt-8">
          This history page is no longer available.{" "}
          <Link href="/bookings" className="underline">
            Return to your latest bookings
          </Link>
          .
        </p>
      ) : history.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-white/15 p-8">
          <h2 className="text-xl">No bookings yet</h2>
          <p className="mt-2 text-white/60">
            Find a car and your first reservation will appear here.
          </p>
          <Link href="/vehicles" className="mt-4 inline-block underline">
            Find a car
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {history.items.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="rounded-xl border border-white/15 bg-white/5 p-5 transition hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <RentalStatus booking={booking} now={history.now} />
                <h2 className="mt-3 text-xl font-semibold">
                  {"vehicleTitle" in booking
                    ? booking.vehicleTitle
                    : `Vehicle ${booking.vehicleId}`}
                </h2>
                <dl className="mt-4 space-y-2 text-sm text-white/70">
                  <div>
                    <dt>Pick-up</dt>
                    <dd>
                      {"extras" in booking
                        ? booking.extras.pickupAt.replace("T", " at ")
                        : booking.startDate}
                    </dd>
                  </div>
                  <div>
                    <dt>Return</dt>
                    <dd>
                      {"extras" in booking
                        ? booking.extras.dropoffAt.replace("T", " at ")
                        : booking.endDate}
                    </dd>
                  </div>
                  <div>
                    <dt>Rental total</dt>
                    <dd className="font-semibold text-white">
                      {"totalLabel" in booking
                        ? booking.totalLabel
                        : "Not recorded"}
                    </dd>
                  </div>
                </dl>
                <span className="mt-4 block text-sm underline">
                  View booking details
                </span>
              </Link>
            ))}
          </div>
          <nav
            aria-label="Booking history pages"
            className="mt-6 flex flex-wrap gap-6"
          >
            {cursor && (
              <Link href="/bookings" className="underline">
                Latest bookings
              </Link>
            )}
            {history.nextCursor && (
              <Link
                href={`/bookings?${new URLSearchParams({ cursor: history.nextCursor })}`}
                className="underline"
              >
                Older bookings
              </Link>
            )}
          </nav>
        </>
      )}
    </main>
  );
}
