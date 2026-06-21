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
    vehicleListHeading: string;
    vehicleListIntro: string;
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
      vehicleListHeading: "Available vehicles",
      vehicleListIntro: "Choose a vehicle and reserve it for your next trip.",
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
      vehicleListHeading: "Reserve your roadline",
      vehicleListIntro: "Pick a vehicle class and keep your post-booking steps moving.",
    },
    theme: {
      primaryMain: "#2e7d32",
      secondaryMain: "#6a1b9a",
    },
  },
} satisfies Record<BrandId, BrandConfig>;

export function getBrandConfig(brandId?: string): BrandConfig {
  if (brandId === "roadline") {
    return brandConfigs.roadline;
  }

  return brandConfigs.handoff;
}
