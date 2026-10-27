"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition, useState } from "react";

export default function AvailabilityFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const dates = `${params.get("pickupAt") ?? ""}|${params.get("dropoffAt") ?? ""}`;
  const [synced, setSynced] = useState(dates);
  const [values, setValues] = useState(dates.split("|"));
  if (synced !== dates) {
    setSynced(dates);
    setValues(dates.split("|"));
  }

  function update() {
    if (!form.current) return;
    const data = new FormData(form.current);
    const next = new URLSearchParams(params.toString());
    for (const key of ["pickupAt", "dropoffAt"]) {
      const value = String(data.get(key) ?? "");
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() =>
      router.replace(`/vehicles?${next}`, { scroll: false }),
    );
  }

  return (
    <form
      ref={form}
      onSubmit={(event) => event.preventDefault()}
      onChange={update}
      className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/15 p-4"
    >
      {[
        ["pickupAt", "Pick-up (UTC)"],
        ["dropoffAt", "Return (UTC)"],
      ].map(([name, label], index) => (
        <label key={name} className="text-sm text-white/70">
          {label}
          <input
            type="datetime-local"
            name={name}
            value={values[index]}
            onChange={(event) =>
              setValues((current) =>
                current.map((value, i) =>
                  i === index ? event.target.value : value,
                ),
              )
            }
            className="mt-1 block rounded border border-white/20 bg-black p-2 [color-scheme:dark]"
          />
        </label>
      ))}
      <p className="w-full text-xs text-white/50">
        Results update automatically. One time checks availability around that
        time; both times check the full rental. Includes 24 hours of preparation
        after return. All times are UTC.
      </p>
      <p role="status" className="text-xs text-white/60">
        {pending ? "Updating available cars…" : ""}
      </p>
    </form>
  );
}
