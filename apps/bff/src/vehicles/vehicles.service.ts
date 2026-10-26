import { Injectable } from '@nestjs/common';
import {
  type Vehicle,
  type VehicleDetail,
  type VehicleFilter,
  type VehicleSummary,
} from '@handoff/contracts';
import { InventoryService } from '../inventory/inventory.service';

const EARTH_RADIUS_MI = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Pricing labels for display. A vehicle is "on sale" only when salePricePerDay
 * is set AND strictly below pricePerDay; then priceLabel shows the discounted
 * price and originalPriceLabel carries the (struck-through) original. Otherwise
 * priceLabel is the regular price and originalPriceLabel is omitted.
 */
function priceLabels(v: Vehicle): {
  priceLabel: string;
  originalPriceLabel?: string;
} {
  const onSale = v.salePricePerDay != null && v.salePricePerDay < v.pricePerDay;
  if (onSale) {
    return {
      priceLabel: `$${v.salePricePerDay}/day`,
      originalPriceLabel: `$${v.pricePerDay}/day`,
    };
  }
  return { priceLabel: `$${v.pricePerDay}/day` };
}

/** Great-circle distance in miles between two lat/lng points. */
function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class VehiclesService {
  constructor(private readonly inventory: InventoryService) {}

  async findAll(filter: VehicleFilter = {}): Promise<VehicleSummary[]> {
    const vehicles = await this.inventory.findAll(filter);

    // Compute distance from the user anchor when both coords are supplied.
    const hasAnchor = filter.lat !== undefined && filter.lng !== undefined;
    const distanceFor = (v: Vehicle): number | undefined =>
      hasAnchor
        ? haversineMiles(
            filter.lat!,
            filter.lng!,
            v.location.latitude,
            v.location.longitude,
          )
        : undefined;

    const summaries = vehicles.map((v) => {
      const miles = distanceFor(v);
      // Effective price = the sale price when on sale, else the regular price.
      // Sorting/filtering by price should reflect what the customer pays.
      const effectivePrice =
        v.salePricePerDay != null && v.salePricePerDay < v.pricePerDay
          ? v.salePricePerDay
          : v.pricePerDay;
      return {
        id: v.id,
        title: `${v.year} ${v.make} ${v.model}`,
        class: v.class,
        transmission: v.transmission,
        seats: v.seats,
        pricePerDay: effectivePrice,
        ...priceLabels(v),
        pickupLocation: v.location.name,
        ...(miles !== undefined && {
          distanceLabel: `${Math.round(miles)} mi away`,
        }),
        // Carry raw distance for sorting; stripped before returning.
        _miles: miles,
      };
    });

    this.sort(summaries, filter.sort);

    return summaries.map(({ _miles, ...summary }) => {
      void _miles;
      return summary;
    });
  }

  /** Fetch a single vehicle by id and reshape it for the detail page. */
  async findOne(id: string): Promise<VehicleDetail> {
    const v = await this.inventory.findOne(id);

    const effectivePrice =
      v.salePricePerDay != null && v.salePricePerDay < v.pricePerDay
        ? v.salePricePerDay
        : v.pricePerDay;

    return {
      id: v.id,
      title: `${v.year} ${v.make} ${v.model}`,
      class: v.class,
      transmission: v.transmission,
      seats: v.seats,
      pricePerDay: effectivePrice,
      ...priceLabels(v),
      pickupLocation: v.location.name,
      pickupAddress: v.location.address,
      pickupLocationId: v.location.id,
    };
  }

  /** Sort in place. `distance` falls back to price when no anchor is set. */
  private sort(
    list: Array<VehicleSummary & { _miles?: number }>,
    sort: VehicleFilter['sort'],
  ): void {
    if (sort === 'price_asc') {
      list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sort === 'distance') {
      list.sort(
        (a, b) =>
          (a._miles ?? Number.POSITIVE_INFINITY) -
          (b._miles ?? Number.POSITIVE_INFINITY),
      );
    }
  }
}
