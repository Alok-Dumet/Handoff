import {
  AemPageContentSchema,
  VehicleSummaryListSchema,
  type AemPageContent,
  type VehicleSummary,
} from "@handoff/contracts";
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
