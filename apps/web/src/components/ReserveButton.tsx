"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  BookingCreationResponseSchema,
  type Checkout,
} from "@handoff/contracts";
import { useRentalSelection } from "./RentalSelection";

const subscribe = () => () => {};
function savedAttempt() {
  try {
    return sessionStorage.getItem("handoff-checkout");
  } catch {
    return null;
  }
}

export default function ReserveButton({
  checkout,
  signedIn,
  returnTo,
  unavailable,
}: {
  checkout: Omit<Checkout, "requestKey"> | null;
  signedIn: boolean;
  returnTo: string;
  unavailable: boolean;
}) {
  const router = useRouter();
  const { updating } = useRentalSelection();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const saved = useSyncExternalStore(subscribe, savedAttempt, () => null);
  let canRetry = false;
  try {
    canRetry =
      !!checkout &&
      JSON.parse(saved ?? "null")?.payload === JSON.stringify(checkout);
  } catch {}

  async function reserve() {
    if (!checkout || busy.current || updating) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      // Keep the same key after a lost response or reload. A changed selection
      // starts a different attempt. The API is the final duplicate safeguard.
      const payload = JSON.stringify(checkout);
      if (attempt.current?.payload !== payload) {
        let saved: { payload?: string; key?: string } | null = null;
        try {
          saved = JSON.parse(
            sessionStorage.getItem("handoff-checkout") ?? "null",
          );
        } catch {}
        attempt.current = {
          payload,
          key:
            saved?.payload === payload && typeof saved.key === "string"
              ? saved.key
              : crypto.randomUUID(),
        };
        try {
          sessionStorage.setItem(
            "handoff-checkout",
            JSON.stringify(attempt.current),
          );
        } catch {}
      }
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Handoff-CSRF": "1" },
        body: JSON.stringify({ ...checkout, requestKey: attempt.current.key }),
      });
      if (response.status === 401) {
        router.push(`/sign-in?next=${encodeURIComponent(returnTo)}`);
        return;
      }
      const body = await response.json();
      if (!response.ok) {
        setError(
          typeof body.message === "string"
            ? body.message
            : "Check your rental selections and try again.",
        );
        return;
      }
      const { booking } = BookingCreationResponseSchema.parse(body);
      router.push(`/bookings/${booking.id}/confirmation`);
    } catch {
      setError(
        "We couldn't confirm the response. Retry with the same selections; you won't be booked twice.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (!signedIn)
    return (
      <Link
        className="rounded-full bg-white px-4 py-3 text-center font-semibold text-black"
        href={`/sign-in?next=${encodeURIComponent(returnTo)}`}
      >
        Log in to reserve
      </Link>
    );
  return (
    <>
      <button
        type="button"
        onClick={reserve}
        disabled={
          !checkout || pending || updating || (unavailable && !canRetry)
        }
        className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending
          ? "Reserving…"
          : updating
            ? "Updating total…"
            : canRetry && unavailable
              ? "Check my reservation"
              : "Reserve car"}
      </button>
      {unavailable && (
        <p role="alert" className="text-sm text-red-300">
          {canRetry
            ? "This car is now reserved or unavailable. Check your previous attempt to retrieve its confirmation."
            : "This car is unavailable for these times. Allow 24 hours after return, or choose another car."}
        </p>
      )}
      {error && (
        <div role="alert" className="text-sm text-red-300">
          <p>{error}</p>
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => router.refresh()}
          >
            Refresh availability and price
          </button>
        </div>
      )}
      <p className="text-center text-xs text-white/50">
        Demo reservation. No payment is collected.
      </p>
    </>
  );
}
