import type { VehicleClass } from "@handoff/contracts";

// Display-only feature lists, keyed by class. Features are largely class-driven
// (a premium car has more amenities than an economy one), so we map per class
// rather than per vehicle. Shown only on the detail/purchase page — these are
// intentionally NOT part of VehicleFilterSchema and not filterable on /vehicles.
//
// Common amenities every car in the fleet has, repeated per class so each list
// reads as a complete spec sheet.
const COMMON: string[] = [
  "Air Conditioning",
  "Bluetooth",
  "Power Windows",
  "Power Locks",
  "Power Steering",
  "Air Bag – Driver/Passenger/Side",
  "Cruise Control",
  "Back-up Camera",
];

export const CLASS_FEATURES: Record<VehicleClass, string[]> = {
  economy: [
    "4 Doors",
    "Holds 2 Large + 2 Small Suitcases",
    "30–38 mpg",
    ...COMMON,
  ],
  compact: [
    "4 Doors",
    "Holds 2 Large + 2 Small Suitcases",
    "28–34 mpg",
    ...COMMON,
  ],
  premium: [
    "4 Doors",
    "Holds 3 Large + 2 Small Suitcases",
    "22–30 mpg",
    "Leather Seats",
    "Apple CarPlay / Android Auto",
    ...COMMON,
  ],
  suv: [
    "4 Doors",
    "Holds 4 Large + 3 Small Suitcases",
    "20–27 mpg",
    "All-Wheel Drive",
    "Roof Rails",
    ...COMMON,
  ],
};
