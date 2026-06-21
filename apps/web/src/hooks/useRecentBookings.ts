"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookings } from "../lib/client-api";
import { bookingQueryKeys } from "./query-keys";

export function useRecentBookings() {
  return useQuery({
    queryKey: bookingQueryKeys.all,
    queryFn: getBookings,
  });
}
