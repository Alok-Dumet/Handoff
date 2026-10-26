"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export default function BookingError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-28 text-white">
      <h1 className="text-2xl font-semibold">
        Could not load your booking information
      </h1>
      <p role="alert" className="mt-3 text-white/70">
        Please try again. Your saved bookings have not changed.
      </p>
      <button
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        disabled={pending}
        className="mt-6 rounded-full bg-white px-5 py-2 text-black"
      >
        {pending ? "Retrying…" : "Try again"}
      </button>
      <Link href="/bookings" className="ml-5 underline">
        Your bookings
      </Link>
    </main>
  );
}
