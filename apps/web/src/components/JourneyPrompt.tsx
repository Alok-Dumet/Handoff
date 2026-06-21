"use client";

import type { JourneyTarget } from "@handoff/contracts";
import { JourneyPrompt as SharedJourneyPrompt } from "@handoff/ui";
import { useJourneyRedirect } from "../hooks/useJourneyRedirect";

export default function JourneyPrompt({
  bookingId,
  journey,
}: {
  bookingId: string;
  journey: JourneyTarget;
}) {
  const { href, redirectToJourney } = useJourneyRedirect(journey);

  return (
    <SharedJourneyPrompt
      bookingId={bookingId}
      journey={journey}
      href={href}
      onNavigate={(event) => {
        event.preventDefault();
        redirectToJourney();
      }}
    />
  );
}
