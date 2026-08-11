import { Injectable } from '@nestjs/common';
import {
  type Quote,
  type QuoteLine,
  type QuoteRequest,
  type Vehicle,
  CENTS_PER_DOLLAR,
  VehicleSchema,
  formatUsd,
  rentalDays,
} from '@handoff/contracts';
import { toUpstreamException } from '../upstream-exception';

/**
 * Local tax applied to the taxable subtotal, in basis points (1 bp = 0.01%).
 * An integer so the tax computation never touches floating point. 950 bp =
 * 9.5%, roughly LA County. A real system would vary this by branch; that
 * belongs in refdata alongside the location, not hard-coded here.
 */
const TAX_BASIS_POINTS = 950;
const BASIS_POINTS_DIVISOR = 10_000;

@Injectable()
export class PricingService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  /**
   * Price a rental. This is the authoritative calculation — the browser
   * renders the result but never computes it, so a tampered client cannot
   * change what the customer is charged.
   */
  async quote(request: QuoteRequest): Promise<Quote> {
    const vehicle = await this.fetchVehicle(request.vehicleId);
    const days = rentalDays(request.pickupAt, request.dropoffAt);

    // Charge the sale price when one applies — same rule the display labels
    // use, so the quote can never disagree with the advertised rate.
    const onSale =
      vehicle.salePricePerDay != null &&
      vehicle.salePricePerDay < vehicle.pricePerDay;
    const dailyRateCents =
      (onSale ? vehicle.salePricePerDay! : vehicle.pricePerDay) *
      CENTS_PER_DOLLAR;

    const vehicleRateCents = dailyRateCents * days;

    // Add-ons (C3) and protection plans (C4) do not have catalogs yet. The
    // lines are emitted at zero so the summary has its full shape now and
    // those features become a lookup, not a reshape.
    const addOnsCents = 0;
    const protectionCents = 0;

    const subtotalCents = vehicleRateCents + protectionCents + addOnsCents;

    // Integer math throughout: multiply first, then divide, then round once.
    const taxCents = Math.round(
      (subtotalCents * TAX_BASIS_POINTS) / BASIS_POINTS_DIVISOR,
    );
    const totalCents = subtotalCents + taxCents;

    const lines: QuoteLine[] = [
      {
        key: 'vehicle_rate',
        label: 'Vehicle Total Rate',
        amountCents: vehicleRateCents,
        amountLabel: formatUsd(vehicleRateCents),
        detail: `${days} ${days === 1 ? 'day' : 'days'} × ${formatUsd(dailyRateCents)}/day`,
      },
      {
        key: 'protection_plan',
        label: 'Protection Plan',
        amountCents: protectionCents,
        amountLabel: formatUsd(protectionCents),
      },
      {
        key: 'add_ons',
        label: 'Add-Ons',
        amountCents: addOnsCents,
        amountLabel: formatUsd(addOnsCents),
      },
      {
        key: 'tax',
        label: 'Local Tax',
        amountCents: taxCents,
        amountLabel: formatUsd(taxCents),
        detail: `${(TAX_BASIS_POINTS / 100).toFixed(2)}%`,
      },
    ];

    return {
      vehicleId: vehicle.id,
      days,
      lines,
      subtotalCents,
      subtotalLabel: formatUsd(subtotalCents),
      taxCents,
      taxLabel: formatUsd(taxCents),
      totalCents,
      totalLabel: formatUsd(totalCents),
    };
  }

  private async fetchVehicle(id: string): Promise<Vehicle> {
    const res = await fetch(
      `${this.refdataUrl}/vehicles/${encodeURIComponent(id)}`,
    );
    if (!res.ok) {
      // Keeps a refdata 404 a 404, so an unknown vehicle is not a 500.
      throw await toUpstreamException(res, `refdata responded ${res.status}`);
    }
    return VehicleSchema.parse(await res.json());
  }
}
