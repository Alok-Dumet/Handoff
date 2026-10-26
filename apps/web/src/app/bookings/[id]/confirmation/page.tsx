import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import BookingReceipt from "@/components/BookingReceipt";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { booking, now } = await getBooking((await params).id, true);
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-16 pt-28 text-white">
      <h1 className="text-3xl font-semibold">
        {booking.status === "confirmed"
          ? "Reservation confirmed"
          : "Your reservation"}
      </h1>
      <BookingReceipt booking={booking} now={now} />
      <p className="mt-5 text-sm text-white/60">
        You can find this reservation in your booking history.
      </p>
      <div className="mt-6 flex flex-wrap gap-6">
        <Link href="/bookings" className="underline">
          Your bookings
        </Link>
        <Link href="/vehicles" className="underline">
          Browse cars
        </Link>
      </div>
    </main>
  );
}
