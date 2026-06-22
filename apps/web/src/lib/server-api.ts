import {
  AemPageContentSchema,
  AemJourneyPageContentSchema,
  AuthSessionSchema,
  CurrentRentalSchema,
  CustomerProfileSchema,
  ReservationDetailSchema,
  VehicleSummaryListSchema,
  type AemPageContent,
  type AemJourneyPageContent,
  type AuthSession,
  type CurrentRental,
  type CustomerProfile,
  type ReservationDetail,
  type VehicleSummary,
} from "@handoff/contracts";
import type { BrandConfig } from "../brands";
import { BffRequestError } from "./bff-errors";
import { getClerkIdentityHeaders } from "./server-auth";

const REFERENCE_DATA_REVALIDATE_SECONDS = 300;
const AEM_CONTENT_REVALIDATE_SECONDS = 60;

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

export async function getAemPageContent(
  brand: BrandConfig,
): Promise<AemPageContent> {
  const res = await fetch(`${getServerBffUrl()}/content/pages/${brand.id}`, {
    next: {
      revalidate: AEM_CONTENT_REVALIDATE_SECONDS,
      tags: ["aem-content", `aem-page-${brand.id}`],
    },
  });

  if (!res.ok) {
    return brandToAemPageContent(brand);
  }

  return AemPageContentSchema.parse(await res.json());
}

export async function getAemJourneyPageContent(
  journey: string,
): Promise<AemJourneyPageContent> {
  const res = await fetch(`${getServerBffUrl()}/content/journeys/${journey}`, {
    next: {
      revalidate: AEM_CONTENT_REVALIDATE_SECONDS,
      tags: ["aem-content", `aem-journey-${journey}`],
    },
  });

  if (!res.ok) {
    return journeyToAemPageContent(journey);
  }

  return AemJourneyPageContentSchema.parse(await res.json());
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

function brandToAemPageContent(brand: BrandConfig): AemPageContent {
  return {
    brandKey: brand.id,
    eyebrow: brand.copy.appEyebrow,
    heading: brand.copy.vehicleListHeading,
    intro: brand.copy.vehicleListIntro,
    recentBookingsHeading: brand.copy.recentBookingsHeading,
    recentBookingsEmpty: brand.copy.recentBookingsEmpty,
    recentBookingsError: brand.copy.recentBookingsError,
    navigation: [{ label: "Vehicles", href: "/vehicles" }],
  };
}

function journeyToAemPageContent(journey: string): AemJourneyPageContent {
  return {
    journey:
      journey === "biometric" ||
      journey === "e-receipt" ||
      journey === "vehicle-upgrade"
        ? journey
        : "pre-check-in",
    label:
      journey === "biometric"
        ? "Biometric verification"
        : journey === "e-receipt"
          ? "E-receipt"
          : journey === "vehicle-upgrade"
            ? "Vehicle upgrade"
            : "Pre-check-in",
    heading:
      journey === "biometric"
        ? "Verify identity"
        : journey === "e-receipt"
          ? "Review receipt"
          : journey === "vehicle-upgrade"
            ? "Review upgrade options"
            : "Confirm trip details",
    intro:
      journey === "biometric"
        ? "Complete identity verification before pickup to reduce manual checks at the branch."
        : journey === "e-receipt"
          ? "Review rental charges, taxes, and receipt delivery preferences for this reservation."
          : journey === "vehicle-upgrade"
            ? "Compare eligible vehicle upgrades and choose whether to keep or change your reservation class."
            : "Review driver and pickup details before arrival so the counter handoff is faster.",
    body:
      journey === "biometric"
        ? "Use the provider handoff to finish identity verification, then return here to review the current state."
        : journey === "e-receipt"
          ? "The receipt reflects the current reservation pricing and can be sent by email or marked for download."
          : journey === "vehicle-upgrade"
            ? "Select a higher-tier vehicle option to review the upgrade and confirm the new reservation class."
            : "Verify the reservation details, update contact information, and make sure the pickup plan is correct before you arrive.",
    primaryActionLabel:
      journey === "biometric"
        ? "Start provider handoff"
        : journey === "e-receipt"
          ? "Update delivery preference"
          : journey === "vehicle-upgrade"
            ? "Choose upgrade"
            : "Complete pre-check-in",
  };
}
