import {
  AuthSessionSchema,
  CurrentRentalSchema,
  CustomerProfileSchema,
  ReservationDetailSchema,
  VehicleSummaryListSchema,
  type AuthSession,
  type CurrentRental,
  type CustomerProfile,
  type ReservationDetail,
  type VehicleSummary,
} from "@handoff/contracts";
import { BffRequestError } from "./bff-errors";
import { getClerkIdentityHeaders } from "./server-auth";

const REFERENCE_DATA_REVALIDATE_SECONDS = 300;

function getServerBffUrl() {
  return process.env.BFF_URL ?? "http://localhost:3001";
}

export async function getVehicles(): Promise<VehicleSummary[]> {
  const res = await fetch(`${getServerBffUrl()}/vehicles`, {
    next: {
      revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
      tags: ["vehicles"],
    },
  });

  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }

  return VehicleSummaryListSchema.parse(await res.json());
}

export async function getAuthSession(): Promise<AuthSession> {
  const res = await fetch(`${getServerBffUrl()}/auth/session`, {
    cache: "no-store",
    headers: await getClerkIdentityHeaders(),
  });

  if (!res.ok) {
    throw new Error(`BFF auth responded ${res.status}`);
  }

  return AuthSessionSchema.parse(await res.json());
}

export async function getCurrentCustomer(): Promise<CustomerProfile> {
  const res = await fetch(`${getServerBffUrl()}/customers/me`, {
    cache: "no-store",
    headers: await getClerkIdentityHeaders(),
  });

  if (!res.ok) {
    throw new Error(`BFF customer responded ${res.status}`);
  }

  return CustomerProfileSchema.parse(await res.json());
}

export async function getReservation(id: string): Promise<ReservationDetail> {
  const res = await fetch(
    `${getServerBffUrl()}/reservations/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new BffRequestError(`Reservation failed with ${res.status}`, res.status);
  }

  return ReservationDetailSchema.parse(await res.json());
}

export async function getCurrentRental(
  reservationId?: string,
): Promise<CurrentRental> {
  const url = `${getServerBffUrl()}/rentals/current`;
  const requestUrl = reservationId
    ? `${url}?reservationId=${encodeURIComponent(reservationId)}`
    : url;

  const res = await fetch(requestUrl, { cache: "no-store" });

  if (!res.ok) {
    throw new BffRequestError(`Rental status failed with ${res.status}`, res.status);
  }

  return CurrentRentalSchema.parse(await res.json());
}
