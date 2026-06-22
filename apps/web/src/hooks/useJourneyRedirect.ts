"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { JourneyTarget } from "@handoff/contracts";

export function useJourneyRedirect(
  journey: JourneyTarget,
  reservationId?: string,
) {
  const router = useRouter();
  const href = buildJourneyHref(journey.path, reservationId);

  const redirectToJourney = useCallback(() => {
    router.push(href);
  }, [href, router]);

  return {
    href,
    redirectToJourney,
  };
}

function buildJourneyHref(path: string, reservationId?: string) {
  if (!reservationId) {
    return path;
  }

  const [pathname, queryString = ""] = path.split("?");
  const searchParams = new URLSearchParams(queryString);
  searchParams.set("reservationId", reservationId);

  return `${pathname}?${searchParams.toString()}`;
}
