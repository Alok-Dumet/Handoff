"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBooking } from "../lib/client-api";
import { bookingQueryKeys } from "./query-keys";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
    },
  });
}
