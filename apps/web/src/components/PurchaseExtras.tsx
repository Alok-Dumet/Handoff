"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRentalSelection } from "./RentalSelection";
import type { PurchaseCatalog, RentalTerms } from "@handoff/contracts";
import { formatUsd } from "@handoff/contracts";

/**
 * Add-on, protection-plan, and terms selection.
 *
 * Selections live in the URL for the same reason the rental window does: the
 * BFF prices from them, and a total the client could compute privately would
 * not be a total. This component writes; the server reads and re-validates.
 */
export default function PurchaseExtras({
  catalog,
  terms,
}: {
  catalog: PurchaseCatalog;
  terms: RentalTerms;
}) {
  const router = useRouter();
  const { updating: pending, update: startTransition } = useRentalSelection();
  const searchParams = useSearchParams();

  const selectedAddOns = new Set(searchParams.getAll("addOnIds"));
  const selectedPlanId =
    searchParams.get("protectionPlanId") ?? catalog.defaultProtectionPlanId;
  const termsAccepted = searchParams.get("termsAccepted") === terms.version;

  const replaceParams = (mutate: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() =>
      router.replace(`?${params.toString()}`, { scroll: false }),
    );
  };

  const toggleAddOn = (id: string) => {
    replaceParams((params) => {
      const next = new Set(searchParams.getAll("addOnIds"));
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      params.delete("addOnIds");
      next.forEach((v) => params.append("addOnIds", v));
    });
  };

  const selectPlan = (id: string) => {
    replaceParams((params) => params.set("protectionPlanId", id));
  };

  const toggleTerms = () => {
    replaceParams((params) => {
      // Store the accepted VERSION, not a boolean: if the terms change, a
      // stale acceptance stops matching and must be given again.
      if (termsAccepted) {
        params.delete("termsAccepted");
      } else {
        params.set("termsAccepted", terms.version);
      }
    });
  };

  return (
    <>
      {/* Protection plans — single select */}
      <fieldset
        disabled={pending}
        className="rounded-xl border border-white/10 bg-white/5 p-5"
      >
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-white/40">
          Protection plan
        </legend>
        <div className="mt-2 flex flex-col gap-2">
          {catalog.protectionPlans.map((plan) => {
            const on = plan.id === selectedPlanId;
            return (
              <label
                key={plan.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  on
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="protectionPlanId"
                  value={plan.id}
                  checked={on}
                  onChange={() => selectPlan(plan.id)}
                  className="mt-1 accent-white"
                />
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-white">
                      {plan.label}
                    </span>
                    <span className="whitespace-nowrap text-sm text-white/70">
                      {plan.pricePerDayCents === 0
                        ? "Included"
                        : `${formatUsd(plan.pricePerDayCents)}/day`}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/50">
                    {plan.description}
                  </span>
                  {plan.covers.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {plan.covers.map((c) => (
                        <li
                          key={c}
                          className="flex items-start gap-1.5 text-xs text-white/60"
                        >
                          <span aria-hidden className="text-white/30">
                            ✓
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Add-ons — multi select */}
      <fieldset
        disabled={pending}
        className="rounded-xl border border-white/10 bg-white/5 p-5"
      >
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-white/40">
          Add-ons
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {catalog.addOns.map((addOn) => {
            const on = selectedAddOns.has(addOn.id);
            return (
              <label
                key={addOn.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  on
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleAddOn(addOn.id)}
                  className="mt-1 accent-white"
                />
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-white">
                      {addOn.label}
                    </span>
                    <span className="whitespace-nowrap text-xs text-white/70">
                      {formatUsd(addOn.priceCents)}
                      {addOn.chargeMode === "per_day" ? "/day" : " once"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/50">
                    {addOn.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Terms & conditions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
          Rental terms
        </h2>
        <p className="mt-2 text-sm text-white/60">{terms.summary}</p>

        <div className="mt-3 flex flex-col gap-2">
          {terms.sections.map((section) => (
            <details
              key={section.heading}
              className="group rounded-lg border border-white/10 px-3 py-2"
            >
              <summary className="cursor-pointer list-none text-sm text-white/80 marker:content-none">
                <span className="inline-flex w-full items-center justify-between gap-2">
                  {section.heading}
                  <span
                    aria-hidden
                    className="text-white/30 transition-transform group-open:rotate-180"
                  >
                    ⌄
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                {section.body}
              </p>
            </details>
          ))}
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            disabled={pending}
            onChange={toggleTerms}
            className="mt-0.5 accent-white"
          />
          <span className="text-sm text-white/70">
            I have read and agree to the rental terms and conditions.
            <span className="block text-xs text-white/35">
              Version {terms.version}
            </span>
          </span>
        </label>
      </div>
    </>
  );
}
