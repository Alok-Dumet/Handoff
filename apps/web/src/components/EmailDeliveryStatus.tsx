"use client";
import { useEffect, useState } from "react";
import { BookingEmailSchema, type BookingEmail } from "@handoff/contracts";

export default function EmailDeliveryStatus({
  bookingId,
  email,
  inboxUrl,
}: {
  bookingId: string;
  email: string;
  inboxUrl?: string;
}) {
  const [delivery, setDelivery] = useState<BookingEmail | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      let finished = false;
      try {
        const response = await fetch(
          `/api/bookings/${encodeURIComponent(bookingId)}/email`,
          {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(5000),
            ]),
          },
        );
        if (!response.ok) throw new Error("Unavailable");
        const status = BookingEmailSchema.parse(await response.json());
        if (cancelled) return;
        setDelivery(status);
        setError(false);
        finished =
          status.status === "sent" || status.status === "not_requested";
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled && !finished)
        timer = setTimeout(() => {
          void refresh();
        }, 5000);
    }
    void refresh();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [bookingId]);
  const message = error
    ? "Email status is temporarily unavailable. Your booking is saved."
    : !delivery
      ? "Checking confirmation email…"
      : delivery.status === "sent"
        ? `Confirmation email sent to ${email}.`
        : delivery.status === "retrying"
          ? "Email delivery is delayed. Your booking is saved and we will keep retrying."
          : delivery.status === "not_requested"
            ? "No confirmation email was requested for this older booking."
            : `Confirmation email is queued for ${email}.`;
  return (
    <div className="mt-5 text-sm text-white/70">
      <p role="status" className="break-words">
        {message}
      </p>
      {inboxUrl && delivery?.status !== "not_requested" && (
        <p className="mt-2">
          Local demo emails stay in the shared demo inbox.{" "}
          <a
            href={inboxUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open local demo inbox
          </a>
        </p>
      )}
    </div>
  );
}
