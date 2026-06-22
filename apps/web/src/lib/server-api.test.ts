import { afterEach, describe, expect, it, vi } from "vitest";
import { getClerkIdentityHeaders } from "./server-auth";
import {
  getAemJourneyPageContent,
  getAemPageContent,
  getAuthSession,
  getCurrentCustomer,
  getCurrentRental,
  getReservation,
  getVehicles,
} from "./server-api";
import { brandConfigs } from "../brands";

vi.mock("./server-auth", () => ({
  getClerkIdentityHeaders: vi.fn(async () => ({})),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("server API helpers", () => {
  it("loads vehicles with reference-data revalidation", async () => {
    vi.stubEnv("BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([vehicleSummary]));

    await expect(getVehicles()).resolves.toEqual([vehicleSummary]);

    expect(fetchMock).toHaveBeenCalledWith("http://bff.test/vehicles", {
      next: {
        revalidate: 300,
        tags: ["vehicles"],
      },
    });
  });

  it("loads brand page content with AEM content revalidation", async () => {
    vi.stubEnv("BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(pageContent));

    await expect(getAemPageContent(brandConfigs.handoff)).resolves.toEqual(
      pageContent,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/content/pages/handoff",
      {
        next: {
          revalidate: 60,
          tags: ["aem-content", "aem-page-handoff"],
        },
      },
    );
  });

  it("loads journey page content from the BFF", async () => {
    vi.stubEnv("BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(journeyPageContent));

    await expect(getAemJourneyPageContent("vehicle-upgrade")).resolves.toEqual(
      journeyPageContent,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/content/journeys/vehicle-upgrade",
      {
        next: {
          revalidate: 60,
          tags: ["aem-content", "aem-journey-vehicle-upgrade"],
        },
      },
    );
  });

  it("keeps auth session reads uncached", async () => {
    vi.stubEnv("BFF_URL", "http://bff.test");
    vi.mocked(getClerkIdentityHeaders).mockResolvedValue({});
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(authSession));

    await expect(getAuthSession()).resolves.toEqual(authSession);

    expect(fetchMock).toHaveBeenCalledWith("http://bff.test/auth/session", {
      cache: "no-store",
      headers: {},
    });
  });

  it("keeps customer profile reads uncached", async () => {
    vi.stubEnv("BFF_URL", "http://bff.test");
    vi.mocked(getClerkIdentityHeaders).mockResolvedValue({});
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(customerProfile));

    await expect(getCurrentCustomer()).resolves.toEqual(customerProfile);

    expect(fetchMock).toHaveBeenCalledWith("http://bff.test/customers/me", {
      cache: "no-store",
      headers: {},
    });
  });

  it("loads reservation detail with the server-only BFF URL", async () => {
    vi.stubEnv("BFF_URL", "http://internal-bff.test");
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://public-bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(reservationDetail));

    await expect(getReservation("booking_123")).resolves.toEqual(
      reservationDetail,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://internal-bff.test/reservations/booking_123",
      { cache: "no-store" },
    );
  });

  it("loads current rental with the server-only BFF URL", async () => {
    vi.stubEnv("BFF_URL", "http://internal-bff.test");
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://public-bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(currentRental));

    await expect(getCurrentRental("booking_123")).resolves.toEqual(
      currentRental,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://internal-bff.test/rentals/current?reservationId=booking_123",
      { cache: "no-store" },
    );
  });
});

const vehicleSummary = {
  id: "veh_001",
  title: "2025 Toyota Corolla",
  class: "compact",
  transmission: "automatic",
  seats: 5,
  pricePerDay: 58,
  priceLabel: "$58/day",
};

const pageContent = {
  brandKey: "handoff",
  eyebrow: "Customer rental portal",
  heading: "Available vehicles",
  intro: "Choose a vehicle and reserve it for your next trip.",
  recentBookingsHeading: "Recent bookings",
  recentBookingsEmpty: "No bookings yet.",
  recentBookingsError: "Could not load bookings.",
  navigation: [
    { label: "HandOff", href: "/brands/handoff" },
    { label: "Roadline", href: "/brands/roadline" },
  ],
};

const journeyPageContent = {
  journey: "vehicle-upgrade",
  label: "Vehicle upgrade",
  heading: "Review upgrade options",
  intro:
    "Compare eligible vehicle upgrades and choose whether to keep or change your reservation class.",
  body:
    "Select a higher-tier vehicle option to review the upgrade and confirm the new reservation class.",
  primaryActionLabel: "Choose upgrade",
};

const authSession = {
  authenticated: true,
  provider: "clerk",
  subject: "user_123",
  email: "driver@example.com",
  displayName: "Test Driver",
  roles: [],
};

const customerProfile = {
  id: "customer_user_123",
  email: "driver@example.com",
  displayName: "Test Driver",
  preferredBrand: "handoff",
  loyaltyTier: "standard",
};

const reservationDetail = {
  id: "booking_123",
  vehicleId: "veh_001",
  vehicleLabel: "2024 Toyota Corolla",
  customerName: "Demo Customer",
  customerEmail: "demo@example.com",
  startDate: "2026-06-21",
  endDate: "2026-06-23",
  status: "confirmed",
  paymentState: "paid",
  detailHref: "/reservations/booking_123",
  nextActionLabel: "Start check-in",
  nextActionHref: "/journeys/pre-check-in?reservationId=booking_123",
  customer: {
    name: "Demo Customer",
    email: "demo@example.com",
  },
  nextJourney: {
    type: "pre-check-in",
    label: "Pre-check-in",
    path: "/journeys/pre-check-in",
    ctaLabel: "Start check-in",
    description:
      "Confirm driver, contact, and pickup details before arriving at the branch.",
  },
  createdAt: "2026-06-22T12:00:00.000Z",
};

const currentRental = {
  rentalId: "rental_booking_123",
  reservationId: "booking_123",
  vehicleId: "veh_001",
  customerId: "customer_demo@example.com",
  customerName: "Demo Customer",
  customerEmail: "demo@example.com",
  status: "active",
  reservationStatus: "confirmed",
  paymentState: "paid",
  vehicleLabel: "2024 Toyota Corolla",
  startDate: "2026-06-21",
  endDate: "2026-06-23",
  pickupLocation: "Primary rental desk",
  returnLocation: "Primary rental return desk",
  supportActions: [
    {
      label: "View reservation",
      href: "/reservations/booking_123",
      variant: "contained",
    },
    {
      label: "View pre-check-in",
      href: "/journeys/pre-check-in?reservationId=booking_123",
      variant: "outlined",
    },
  ],
  updatedAt: "2026-06-22T12:00:00.000Z",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
