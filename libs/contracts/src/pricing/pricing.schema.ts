import { z } from 'zod';
import { LocalDateTimeSchema } from '../rental-window/rental-window.schema.js';

/**
 * Pricing contract for the purchase page's booking summary.
 *
 * Every amount is an integer number of CENTS. Money is never a float here:
 * 0.1 + 0.2 !== 0.3 in binary floating point, and a rounding drift of one cent
 * between the quote shown and the booked total is a real defect.
 * Formatting to "$123.45" happens once, on the way out.
 */
export const CENTS_PER_DOLLAR = 100;

/** Format integer cents as US currency, e.g. 123456 -> "$1,234.56". */
export function formatUsd(cents: number): string {
  return (cents / CENTS_PER_DOLLAR).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

/**
 * The line items of the booking summary, in display order. Fixed as an enum
 * rather than free strings so the frontend can rely on which rows exist.
 */
export const QuoteLineKeySchema = z.enum([
  'vehicle_rate',
  'protection_plan',
  'add_ons',
  'tax',
]);
export type QuoteLineKey = z.infer<typeof QuoteLineKeySchema>;

export const QuoteLineSchema = z.object({
  key: QuoteLineKeySchema,
  label: z.string(),
  amountCents: z.number().int().nonnegative(),
  amountLabel: z.string(),
  /** Optional workings, e.g. "3 days x $42.00/day". */
  detail: z.string().optional(),
});
export type QuoteLine = z.infer<typeof QuoteLineSchema>;

/**
 * A priced rental. Computed by the BFF and rendered as-is by the web app —
 * the browser never does this arithmetic, because a total the client can
 * change is not a total.
 */
export const QuoteSchema = z.object({
  vehicleId: z.string(),
  /** Billable days, per the rental-window rounding convention. */
  days: z.number().int().positive(),
  lines: z.array(QuoteLineSchema),
  subtotalCents: z.number().int().nonnegative(),
  subtotalLabel: z.string(),
  taxCents: z.number().int().nonnegative(),
  taxLabel: z.string(),
  totalCents: z.number().int().nonnegative(),
  totalLabel: z.string(),
});
export type Quote = z.infer<typeof QuoteSchema>;

/**
 * What the client asks to be priced. Add-ons and protection are accepted from
 * the start (defaulting to none) so introducing those catalogs does not change
 * this shape. Numerics stay strings-friendly since this arrives as a query.
 */
export const QuoteRequestSchema = z.object({
  vehicleId: z.string().min(1),
  pickupAt: LocalDateTimeSchema,
  dropoffAt: LocalDateTimeSchema,
  addOnIds: z.array(z.string().min(1)).default([]),
  protectionPlanId: z.string().min(1).optional(),
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
