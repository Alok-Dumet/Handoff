import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type Quote,
  type QuoteLine,
  type QuoteRequest,
  CENTS_PER_DOLLAR,
  formatUsd,
  rentalDays,
} from '@handoff/contracts';
import { CatalogService } from '../catalog/catalog.service';
import { InventoryService } from '../inventory/inventory.service';

/**
 * Local tax applied to the taxable subtotal, in basis points (1 bp = 0.01%).
 * An integer so the tax computation never touches floating point. 950 bp =
 * 9.5%, roughly LA County. A real system would vary this by branch; that
 * would be stored alongside the location rather than hard-coded here.
 */
const TAX_BASIS_POINTS = 950;
const BASIS_POINTS_DIVISOR = 10_000;

@Injectable()
export class PricingService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
  ) {}

  /**
   * Price a rental. This is the authoritative calculation — the browser
   * renders the result but never computes it, so a tampered client cannot
   * change what the customer is charged.
   */
  async quote(request: QuoteRequest): Promise<Quote> {
    const vehicle = await this.inventory.findOne(request.vehicleId);
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

    // Resolve the protection plan. An unknown id is rejected rather than
    // ignored — silently falling back to "none" would charge for coverage the
    // customer did not get, or vice versa.
    const plan = request.protectionPlanId
      ? this.catalog.findProtectionPlan(request.protectionPlanId)
      : this.catalog.defaultProtectionPlan();
    if (!plan) {
      throw new BadRequestException(
        `Unknown protection plan "${request.protectionPlanId}"`,
      );
    }
    const protectionCents = plan.pricePerDayCents * days;

    // Resolve add-ons the same way. Duplicates in the query are collapsed:
    // quantity is not modelled yet, so the same id twice is one of that item.
    const uniqueAddOnIds = [...new Set(request.addOnIds)];
    const addOns = uniqueAddOnIds.map((id) => {
      const addOn = this.catalog.findAddOn(id);
      if (!addOn) {
        throw new BadRequestException(`Unknown add-on "${id}"`);
      }
      return addOn;
    });
    const addOnsCents = addOns.reduce(
      (sum, a) =>
        sum + (a.chargeMode === 'per_day' ? a.priceCents * days : a.priceCents),
      0,
    );

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
        detail:
          plan.pricePerDayCents > 0
            ? `${plan.label} — ${days} × ${formatUsd(plan.pricePerDayCents)}/day`
            : plan.label,
      },
      {
        key: 'add_ons',
        label: 'Add-Ons',
        amountCents: addOnsCents,
        amountLabel: formatUsd(addOnsCents),
        detail:
          addOns.length > 0
            ? addOns.map((a) => a.label).join(', ')
            : 'None selected',
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
}
