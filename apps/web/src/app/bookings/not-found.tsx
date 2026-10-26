import Link from "next/link";
export default function BookingNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-28 text-white">
      <h1 className="text-2xl font-semibold">Booking not found</h1>
      <p className="mt-3 text-white/70">
        This booking is not available in your account.
      </p>
      <Link href="/bookings" className="mt-6 inline-block underline">
        Your bookings
      </Link>
    </main>
  );
}
