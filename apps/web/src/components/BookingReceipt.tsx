import { type BookingRecord } from "@handoff/contracts";
import RentalStatus from "./RentalStatus";
import EmailDeliveryStatus from "./EmailDeliveryStatus";

export default function BookingReceipt({
  booking,
  now,
}: {
  booking: BookingRecord;
  now: number;
}) {
  const detailed = "extras" in booking;
  return (
    <section className="mt-6 space-y-5 rounded-xl border border-white/15 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {detailed ? booking.vehicleTitle : `Vehicle ${booking.vehicleId}`}
        </h2>
        <RentalStatus booking={booking} now={now} />
      </div>
      <p className="break-all text-sm text-white/60">
        Booking reference: {booking.id}
      </p>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-white/50">Driver</dt>
          <dd className="break-words">
            {booking.customerName}
            <br />
            {booking.customerEmail}
          </dd>
        </div>
        <div>
          <dt className="text-white/50">Booked on (UTC)</dt>
          <dd>{booking.createdAt.slice(0, 16).replace("T", " at ")}</dd>
        </div>
        <div>
          <dt className="text-white/50">Pick-up (UTC)</dt>
          <dd>
            {detailed
              ? booking.extras.pickupAt.replace("T", " at ")
              : booking.startDate}
          </dd>
        </div>
        <div>
          <dt className="text-white/50">Return (UTC)</dt>
          <dd>
            {detailed
              ? booking.extras.dropoffAt.replace("T", " at ")
              : booking.endDate}
          </dd>
        </div>
        {detailed && (
          <div>
            <dt className="text-white/50">Pick-up and return branch</dt>
            <dd>
              {booking.pickupLocationName}
              <br />
              {booking.pickupAddress}
            </dd>
          </div>
        )}
      </dl>
      {detailed ? (
        <>
          <dl className="space-y-3 border-t border-white/15 pt-4">
            {booking.quote.lines.map((line) => (
              <div
                key={line.key}
                className="flex justify-between gap-4 text-sm"
              >
                <dt>
                  {line.label}
                  <span className="block text-xs text-white/50">
                    {line.detail}
                  </span>
                </dt>
                <dd className="shrink-0">{line.amountLabel}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/15 pt-4 font-semibold">
              <dt>Rental total</dt>
              <dd>{booking.totalLabel}</dd>
            </div>
          </dl>
          <p className="text-xs text-white/50">
            Accepted rental terms: {booking.extras.acceptedTermsVersion}
          </p>
        </>
      ) : (
        <p className="text-sm text-white/60">
          This older booking has no saved price breakdown, extras, branch
          details, or precise pickup and return times.
        </p>
      )}
      <p className="text-sm text-white/60">
        No payment was collected. The scheduled return completes the rental; the
        car becomes available again after a further 24 hours.
      </p>
      <EmailDeliveryStatus
        key={booking.id}
        bookingId={booking.id}
        email={booking.customerEmail}
        inboxUrl={
          process.env.DEMO_INBOX_URL ||
          (process.env.NODE_ENV === "development"
            ? "http://localhost:8025"
            : undefined)
        }
      />
    </section>
  );
}
