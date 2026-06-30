import type { VehicleClass } from "@handoff/contracts";

// One image per class lives in /public; cars of the same class share it.
// Shared by the list card and the detail page so the mapping lives once.
export const CLASS_IMAGE: Record<VehicleClass, string> = {
  economy: "/economy.png",
  compact: "/compact.png",
  premium: "/premium.png",
  suv: "/suv.png",
};
