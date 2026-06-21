"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { JourneyTarget } from "@handoff/contracts";

export function useJourneyRedirect(journey: JourneyTarget) {
  const router = useRouter();

  const redirectToJourney = useCallback(() => {
    router.push(journey.path);
  }, [journey.path, router]);

  return {
    href: journey.path,
    redirectToJourney,
  };
}
