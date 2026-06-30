import { Injectable } from '@nestjs/common';
import {
  type Vehicle,
  type VehicleDetail,
  type VehicleFilter,
  type VehicleSummary,
  VehicleListSchema,
  VehicleSchema,
} from '@handoff/contracts';
import { toUpstreamException } from '../upstream-exception';

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
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  async findAll(filter: VehicleFilter = {}): Promise<VehicleSummary[]> {
    // Forward the data filters (class/transmission/seats/price) to refdata,
    // which owns the DB. Distance + sorting are layered on here in the BFF.
    const params = new URLSearchParams();
    filter.classes?.forEach((c) => params.append('classes', c));
    if (filter.transmission) params.set('transmission', filter.transmission);
    if (filter.minSeats !== undefined)
      params.set('minSeats', String(filter.minSeats));
    if (filter.minPricePerDay !== undefined)
      params.set('minPricePerDay', String(filter.minPricePerDay));
    if (filter.maxPricePerDay !== undefined)
      params.set('maxPricePerDay', String(filter.maxPricePerDay));

    const qs = params.toString();
    const res = await fetch(`${this.refdataUrl}/vehicles${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      throw await toUpstreamException(res, `refdata responded ${res.status}`);
    }

    // Validate the domain response at the boundary: if refdata's shape ever
    // drifts from the contract, we fail loudly here instead of leaking bad
    // data to the frontend.
    const vehicles = VehicleListSchema.parse(await res.json());

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
    const res = await fetch(
      `${this.refdataUrl}/vehicles/${encodeURIComponent(id)}`,
    );
    if (!res.ok) {
      // Preserves the upstream status, so a refdata 404 stays a 404 here.
      throw await toUpstreamException(res, `refdata responded ${res.status}`);
    }

    const v = VehicleSchema.parse(await res.json());

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
