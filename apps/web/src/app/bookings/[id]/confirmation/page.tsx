import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { BookingDetailSchema, SESSION_COOKIE_NAME } from "@handoff/contracts";
import { getCurrentUser } from "@/lib/session";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await getCurrentUser()))
    redirect(
      `/sign-in?next=${encodeURIComponent(`/bookings/${id}/confirmation`)}`,
    );
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const response = await fetch(
    `${process.env.BFF_URL ?? "http://localhost:3001"}/bookings/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    },
  );
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error("Could not load your booking. Please retry.");
  const parsed = BookingDetailSchema.safeParse(await response.json());
  if (!parsed.success) notFound();
  const booking = parsed.data;
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-16 pt-28 text-white">
      <p className="text-emerald-300">Reservation confirmed</p>
      <h1 className="mt-2 text-3xl font-semibold">
        You&apos;re ready to go, {booking.customerName}.
      </h1>
      <div className="mt-8 space-y-5 rounded-xl border border-white/15 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">{booking.vehicleTitle}</h2>
        <p className="break-all text-sm text-white/60">
          Booking reference: {booking.id}
        </p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-white/50">Pick-up (UTC)</dt>
            <dd>{booking.extras.pickupAt.replace("T", " at ")}</dd>
          </div>
          <div>
            <dt className="text-white/50">Return (UTC)</dt>
            <dd>{booking.extras.dropoffAt.replace("T", " at ")}</dd>
          </div>
          <div>
            <dt className="text-white/50">Pick-up and return branch</dt>
            <dd>
              {booking.pickupLocationName}
              <br />
              {booking.pickupAddress}
            </dd>
          </div>
        </dl>
        <dl className="space-y-3 border-t border-white/15 pt-4">
          {booking.quote.lines.map((line) => (
            <div key={line.key} className="flex justify-between gap-4 text-sm">
              <dt>
                {line.label}
                <span className="block text-xs text-white/50">
                  {line.detail}
                </span>
              </dt>
              <dd>{line.amountLabel}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/15 pt-4 font-semibold">
            <dt>Rental total</dt>
            <dd>{booking.totalLabel}</dd>
          </div>
        </dl>
        <p className="text-sm text-white/60">
          No payment was collected. Keep this page as your confirmation; email
          delivery is not available yet.
        </p>
      </div>
      <Link href="/vehicles" className="mt-6 inline-block underline">
        Browse cars
      </Link>
    </main>
  );
}
