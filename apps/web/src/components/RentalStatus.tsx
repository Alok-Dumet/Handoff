"use client";
import { useSyncExternalStore } from "react";
import { rentalState, type BookingRecord } from "@handoff/contracts";

function subscribe(callback: () => void) {
  const timer = setInterval(callback, 1000);
  window.addEventListener("focus", callback);
  return () => {
    clearInterval(timer);
    window.removeEventListener("focus", callback);
  };
}
const currentSecond = () => Math.floor(Date.now() / 1000) * 1000;

export default function RentalStatus({
  booking,
  now,
}: {
  booking: BookingRecord;
  now: number;
}) {
  const time = useSyncExternalStore(subscribe, currentSecond, () => now);
  return (
    <span
      aria-live="polite"
      className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-white"
    >
      {rentalState(booking, time)}
    </span>
  );
}
