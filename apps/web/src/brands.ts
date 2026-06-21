export type BrandId = "handoff" | "roadline";

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

export const brandConfigs = {
  handoff: {
    id: "handoff",
    name: "HandOff",
    shortName: "HandOff",
    metadata: {
      title: "HandOff",
      description: "Car rental platform",
    },
    copy: {
      appEyebrow: "Customer journey demo",
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
  },
  roadline: {
    id: "roadline",
    name: "Roadline Reserve",
    shortName: "Roadline",
    metadata: {
      title: "Roadline Reserve",
      description: "Premium vehicle reservations for frequent travelers",
    },
    copy: {
      appEyebrow: "Roadline member reservations",
      vehicleListHeading: "Reserve your roadline",
      vehicleListIntro: "Pick a vehicle class and keep your post-booking steps moving.",
      recentBookingsHeading: "Recent roadline reservations",
      recentBookingsEmpty: "No Roadline reservations yet.",
      recentBookingsError: "Roadline reservations could not be loaded.",
    },
    theme: {
      primaryMain: "#2e7d32",
      secondaryMain: "#6a1b9a",
    },
  },
} satisfies Record<BrandId, BrandConfig>;

export const brandIds = Object.keys(brandConfigs) as BrandId[];

export function isBrandId(brandId: string): brandId is BrandId {
  return brandId in brandConfigs;
}

export function getBrandConfig(brandId?: string): BrandConfig {
  if (brandId === "roadline") {
    return brandConfigs.roadline;
  }

  return brandConfigs.handoff;
}
