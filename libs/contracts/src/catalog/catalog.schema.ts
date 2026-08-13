import { z } from 'zod';

/**
 * Reference catalogs for purchase-page extras: add-ons and protection plans.
 *
 * Prices are integer CENTS, same as the pricing contract — money never touches
 * a float. Both catalogs are served by the BFF from static config for now; the
 * shapes are DB-ready so moving them into refdata later is a storage change,
 * not a contract change.
 */

/**
 * How an extra is charged. `per_day` multiplies by billable rental days;
 * `flat` is charged once for the rental. Child seats are per-day; a one-off
 * cleaning fee would be flat.
 */
export const ChargeModeSchema = z.enum(['per_day', 'flat']);
export type ChargeMode = z.infer<typeof ChargeModeSchema>;

export const AddOnSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  chargeMode: ChargeModeSchema,
  /** Cap on how many of this add-on a single rental may take. */
  maxQuantity: z.number().int().positive().default(1),
});
export type AddOn = z.infer<typeof AddOnSchema>;

export const AddOnListSchema = z.array(AddOnSchema);
export type AddOnList = z.infer<typeof AddOnListSchema>;

/**
 * Protection plans are single-select and tiered. The "none" tier is a real
 * catalog entry priced at zero rather than an absent selection, so declining
 * coverage is an explicit choice on the record instead of a missing field.
 */
export const ProtectionPlanSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  /** Always per-day for plans; kept explicit for display. */
  pricePerDayCents: z.number().int().nonnegative(),
  /** Bullet points shown under the plan name. */
  covers: z.array(z.string()),
});
export type ProtectionPlan = z.infer<typeof ProtectionPlanSchema>;

export const ProtectionPlanListSchema = z.array(ProtectionPlanSchema);
export type ProtectionPlanList = z.infer<typeof ProtectionPlanListSchema>;

/** Everything the purchase page needs to render its extras, in one fetch. */
export const PurchaseCatalogSchema = z.object({
  addOns: AddOnListSchema,
  protectionPlans: ProtectionPlanListSchema,
  /** The plan selected when the customer has not chosen one. */
  defaultProtectionPlanId: z.string().min(1),
});
export type PurchaseCatalog = z.infer<typeof PurchaseCatalogSchema>;

/**
 * Terms & conditions shown on the purchase page. Treated as untrusted content
 * (it will come from a CMS later), so it is validated before render and
 * carries a version — an acceptance record is worthless without knowing which
 * text was accepted.
 */
export const TermsSectionSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
});
export type TermsSection = z.infer<typeof TermsSectionSchema>;

export const RentalTermsSchema = z.object({
  version: z.string().min(1),
  summary: z.string().min(1),
  sections: z.array(TermsSectionSchema).min(1),
});
export type RentalTerms = z.infer<typeof RentalTermsSchema>;
