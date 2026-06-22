export const bookingQueryKeys = {
  all: ["bookings"] as const,
};

export const reservationQueryKeys = {
  all: ["reservations"] as const,
  detail: (id: string) => ["reservations", id] as const,
};

export const journeyQueryKeys = {
  preCheckIn: (reservationId: string) =>
    ["journeys", "pre-check-in", reservationId] as const,
  identityVerification: (reservationId: string) =>
    ["journeys", "identity-verification", reservationId] as const,
  eReceipt: (reservationId: string) =>
    ["journeys", "e-receipt", reservationId] as const,
};
