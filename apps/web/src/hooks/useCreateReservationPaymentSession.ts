"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateReservationPaymentSession } from "@handoff/contracts";
import { createReservationPaymentSession } from "../lib/client-api";
import { reservationQueryKeys } from "./query-keys";

export function useCreateReservationPaymentSession(reservationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationPaymentSession) =>
      createReservationPaymentSession(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: reservationQueryKeys.detail(reservationId),
        }),
      ]);
    },
  });
}
