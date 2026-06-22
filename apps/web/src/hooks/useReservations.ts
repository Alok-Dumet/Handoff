"use client";

import { useQuery } from "@tanstack/react-query";
import { getReservations } from "../lib/client-api";
import { reservationQueryKeys } from "./query-keys";

export function useReservations() {
  return useQuery({
    queryKey: reservationQueryKeys.all,
    queryFn: getReservations,
  });
}
