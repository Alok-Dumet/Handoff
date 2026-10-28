import { Injectable } from "@nestjs/common";
import {
  type AddOn,
  type ProtectionPlan,
  type PurchaseCatalog,
  type RentalTerms,
} from "@handoff/contracts";
import { PURCHASE_CATALOG, RENTAL_TERMS } from "./catalog.data";

/**
 * Serves the purchase-page reference data, and is the single place that
 * resolves an id to a priced item. Pricing depends on these lookups, so
 * keeping them here means an unknown id is rejected in one place rather than
 * silently priced as zero in several.
 */
@Injectable()
export class CatalogService {
  getCatalog(): PurchaseCatalog {
    return PURCHASE_CATALOG;
  }

  getTerms(): RentalTerms {
    return RENTAL_TERMS;
  }

  findAddOn(id: string): AddOn | undefined {
    return PURCHASE_CATALOG.addOns.find((a) => a.id === id);
  }

  findProtectionPlan(id: string): ProtectionPlan | undefined {
    return PURCHASE_CATALOG.protectionPlans.find((p) => p.id === id);
  }

  defaultProtectionPlan(): ProtectionPlan {
    const plan = this.findProtectionPlan(
      PURCHASE_CATALOG.defaultProtectionPlanId,
    );
    if (!plan) {
      // Unreachable via the schema, but a silent undefined here would price a
      // rental with no coverage line at all.
      throw new Error(
        `Catalog default protection plan "${PURCHASE_CATALOG.defaultProtectionPlanId}" is missing`,
      );
    }
    return plan;
  }
}
