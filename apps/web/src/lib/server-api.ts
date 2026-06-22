import {
  AemPageContentSchema,
  AemJourneyPageContentSchema,
  AuthSessionSchema,
  CustomerProfileSchema,
  VehicleSummaryListSchema,
  type AemPageContent,
  type AemJourneyPageContent,
  type AuthSession,
  type CustomerProfile,
  type VehicleSummary,
} from "@handoff/contracts";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { BrandConfig } from "../brands";

function getServerBffUrl() {
  return process.env.BFF_URL ?? "http://localhost:3001";
}

export async function getVehicles(): Promise<VehicleSummary[]> {
  const res = await fetch(`${getServerBffUrl()}/vehicles`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }

  return VehicleSummaryListSchema.parse(await res.json());
}

export async function getAemPageContent(
  brand: BrandConfig,
): Promise<AemPageContent> {
  const res = await fetch(`${getServerBffUrl()}/content/pages/${brand.id}`, {
    cache: "no-store",
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
    cache: "no-store",
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

async function getClerkIdentityHeaders(): Promise<HeadersInit> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {};
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const displayName =
      user?.fullName ?? user?.username ?? email ?? "HandOff Customer";

    const internalSecret = process.env.BFF_INTERNAL_AUTH_SECRET;

    return {
      "x-handoff-clerk-user-id": userId,
      "x-handoff-display-name": encodeURIComponent(displayName),
      ...(internalSecret ? { "x-handoff-internal-secret": internalSecret } : {}),
      ...(email ? { "x-handoff-email": encodeURIComponent(email) } : {}),
    };
  } catch {
    return {};
  }
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
    navigation: [
      { label: "HandOff", href: "/brands/handoff" },
      { label: "Roadline", href: "/brands/roadline" },
    ],
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
