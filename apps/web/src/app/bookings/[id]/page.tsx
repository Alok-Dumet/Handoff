import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import BookingReceipt from "@/components/BookingReceipt";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { booking, now } = await getBooking((await params).id);
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-16 pt-28 text-white">
      <Link href="/bookings" className="text-sm underline">
        Back to your bookings
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Booking details</h1>
      <BookingReceipt booking={booking} now={now} />
    </main>
  );
}
