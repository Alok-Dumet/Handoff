export type BrandId = "handoff";

export type BrandConfig = {
  id: BrandId;
  name: string;
  shortName: string;
  metadata: {
    title: string;
    description: string;
  };
  copy: {
    appEyebrow: string;
    vehicleListHeading: string;
    vehicleListIntro: string;
    recentBookingsHeading: string;
    recentBookingsEmpty: string;
    recentBookingsError: string;
  };
  theme: {
    primaryMain: string;
    secondaryMain: string;
  };
};

export const handoffBrand = {
  id: "handoff",
  name: "HandOff",
  shortName: "HandOff",
  metadata: {
    title: "HandOff",
    description:
      "Car rental platform for vehicle search, booking, and post-confirmation customer journeys",
  },
  copy: {
    appEyebrow: "Customer rental portal",
    vehicleListHeading: "Available vehicles",
    vehicleListIntro: "Choose a vehicle and reserve it for your next trip.",
    recentBookingsHeading: "Recent bookings",
    recentBookingsEmpty: "No bookings yet.",
    recentBookingsError: "Could not load bookings.",
  },
  theme: {
    primaryMain: "#1565c0",
    secondaryMain: "#00897b",
  },
} satisfies BrandConfig;

export const brandConfigs = {
  handoff: handoffBrand,
} satisfies Record<BrandId, BrandConfig>;

export function getBrandConfig(): BrandConfig {
  return handoffBrand;
}
