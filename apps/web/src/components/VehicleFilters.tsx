"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GeocodeResult, VehicleClass } from "@handoff/contracts";
import { geocode } from "@/lib/vehicles";

const CLASSES: VehicleClass[] = ["economy", "compact", "premium", "suv"];
const PRICE_MIN = 0;
const PRICE_MAX = 150;
const PRICE_STEP = 5;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// Clamp a value between min and max
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function parsePrice(value: string | null, fallback: number): number {
  const parsed = value === null ? fallback : Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, PRICE_MIN, PRICE_MAX) : fallback;
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white/50"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ── Price range slider ────────────────────────────────────────────────────────
// Two-thumb range slider built on a single <div> track with two <input
// type="range"> elements stacked on top of each other. The fill between the
// thumbs is drawn via a CSS linear-gradient on the track.
function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  onChangeCommitted,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  onChangeCommitted: (v: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const loRef = useRef<HTMLInputElement>(null);
  const hiRef = useRef<HTMLInputElement>(null);

  const trackStyle = {
    background: `linear-gradient(
      to right,
      rgba(255,255,255,0.1) ${pct(lo)}%,
      white ${pct(lo)}%,
      white ${pct(hi)}%,
      rgba(255,255,255,0.1) ${pct(hi)}%
    )`,
  };

  return (
    <div className="relative h-5 w-full">
      {/* Track */}
      <div
        className="pointer-events-none absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full"
        style={trackStyle}
      />

      {/* Low thumb */}
      <input
        ref={loRef}
        type="range"
        aria-label="Minimum daily price"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) => {
          const next = clamp(Number(e.target.value), min, hi - step);
          onChange([next, hi]);
        }}
        onMouseUp={() => onChangeCommitted([lo, hi])}
        onTouchEnd={() => onChangeCommitted([lo, hi])}
        onKeyUp={() => onChangeCommitted([lo, hi])}
        className="range-thumb pointer-events-none absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
      />

      {/* High thumb */}
      <input
        ref={hiRef}
        type="range"
        aria-label="Maximum daily price"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) => {
          const next = clamp(Number(e.target.value), lo + step, max);
          onChange([lo, next]);
        }}
        onMouseUp={() => onChangeCommitted([lo, hi])}
        onTouchEnd={() => onChangeCommitted([lo, hi])}
        onKeyUp={() => onChangeCommitted([lo, hi])}
        className="range-thumb pointer-events-none absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
      />
    </div>
  );
}

// ── Location autocomplete ─────────────────────────────────────────────────────
function LocationAutocomplete({
  onSelect,
}: {
  onSelect: (result: GeocodeResult) => void;
}) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // The query the current `options` correspond to. Comparing it against the
  // live debounced query is what tells us a lookup is still outstanding.
  const [settledQuery, setSettledQuery] = useState("");

  const debouncedInput = useDebounced(input, 400);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // All three of these are derived, not stored: a query under 3 chars has no
  // suggestions by definition, and a query we haven't settled yet is in flight.
  // Deriving avoids setState in the effect body, which would cascade renders.
  const tooShort = debouncedInput.trim().length < 3;
  const visibleOptions = tooShort ? [] : options;
  const listOpen = open && !tooShort;
  const loading = !tooShort && settledQuery !== debouncedInput;

  useEffect(() => {
    if (tooShort) return;
    let active = true;
    geocode(debouncedInput)
      .then((res) => {
        if (!active) return;
        setOptions(res);
        setOpen(res.length > 0);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (!active) return;
        setOptions([]);
        setOpen(false);
        setActiveIndex(-1);
      })
      .finally(() => {
        if (active) setSettledQuery(debouncedInput);
      });
    return () => { active = false; };
  }, [debouncedInput, tooShort]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (o: GeocodeResult) => {
    setInput(o.label);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(o);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!listOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(visibleOptions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const listId = "location-listbox";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={listOpen}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `loc-opt-${activeIndex}` : undefined
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => visibleOptions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a US location"
          className="w-full rounded-md border border-white/20 bg-transparent px-3 py-1.5 pr-8 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none"
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Spinner />
          </span>
        )}
        {!loading && input && (
          <button
            onClick={() => {
              setInput("");
              setOptions([]);
              setOpen(false);
              // Reset so retyping the same query still shows the spinner.
              setSettledQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
            aria-label="Clear location"
          >
            ✕
          </button>
        )}
      </div>

      {listOpen && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-white/15 bg-zinc-900 py-1 shadow-xl"
        >
          {visibleOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-white/40">No places found</li>
          ) : (
            visibleOptions.map((o, i) => (
              <li
                key={`${o.latitude},${o.longitude}`}
                id={`loc-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => select(o)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedClasses = searchParams.getAll("classes") as VehicleClass[];
  const transmission = searchParams.get("transmission") ?? "";
  const minSeats = searchParams.get("minSeats") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const priceHigh = Math.max(PRICE_STEP, parsePrice(searchParams.get("maxPricePerDay"), PRICE_MAX));
  const priceLow = Math.min(priceHigh - PRICE_STEP, parsePrice(searchParams.get("minPricePerDay"), PRICE_MIN));

  const update = (changes: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      params.delete(key);
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value !== null && value !== "") {
        params.set(key, value);
      }
    }
    router.replace(`/vehicles?${params.toString()}`, { scroll: false });
  };

  const [geoState, setGeoState] = useState<
    "idle" | "locating" | "granted" | "denied"
  >(searchParams.has("lat") ? "granted" : "idle");

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("denied");
      return;
    }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState("granted");
        update({
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
          sort: "distance",
        });
      },
      () => setGeoState("denied"),
    );
  };

  // The slider keeps local state while dragging, then commits to the URL. When
  // the URL range changes from elsewhere (e.g. "Clear all filters"), re-sync by
  // adjusting state during render rather than in an effect, which would cascade
  // an extra render pass. See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [price, setPrice] = useState<[number, number]>([priceLow, priceHigh]);
  const [syncedRange, setSyncedRange] = useState<[number, number]>([
    priceLow,
    priceHigh,
  ]);
  if (syncedRange[0] !== priceLow || syncedRange[1] !== priceHigh) {
    setSyncedRange([priceLow, priceHigh]);
    setPrice([priceLow, priceHigh]);
  }

  const hasAnchor = searchParams.has("lat");
  const anyActive = useMemo(
    () =>
      selectedClasses.length > 0 ||
      transmission !== "" ||
      minSeats !== "" ||
      sort !== "" ||
      hasAnchor ||
      priceLow !== PRICE_MIN ||
      priceHigh !== PRICE_MAX,
    [selectedClasses.length, transmission, minSeats, sort, hasAnchor, priceLow, priceHigh],
  );

  const toggleClass = (c: VehicleClass) => {
    const next = selectedClasses.includes(c)
      ? selectedClasses.filter((x) => x !== c)
      : [...selectedClasses, c];
    update({ classes: next });
  };

  const clearAll = () => {
    router.replace("/vehicles", { scroll: false });
    setGeoState("idle");
  };

  const selectSx = "rounded-md border border-white/20 bg-black px-2 py-1 text-sm text-white focus:border-white/50 focus:outline-none";

  return (
    <>
      {/* Thumb styles: scoped here so they don't leak globally */}
      <style>{`
        .range-thumb { pointer-events: none; }
        .range-thumb::-webkit-slider-thumb {
          pointer-events: all;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.4);
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.4);
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .range-thumb:focus-visible::-webkit-slider-thumb {
          outline: 2px solid white;
          outline-offset: 2px;
        }
      `}</style>

      <div className="mb-8 flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-5">
        {/* Location row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={useMyLocation}
            disabled={geoState === "locating"}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {geoState === "locating" ? "Locating…" : "Use my location"}
          </button>

          <LocationAutocomplete
            onSelect={(result) => {
              update({
                lat: String(result.latitude),
                lng: String(result.longitude),
                sort: "distance",
              });
              setGeoState("granted");
            }}
          />
        </div>

        {geoState === "denied" && (
          <p className="-mt-2 text-xs text-white/40">
            Location unavailable — search for a place above instead.
          </p>
        )}

        {/* Class pills */}
        <div className="flex flex-wrap gap-2">
          {CLASSES.map((c) => {
            const on = selectedClasses.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleClass(c)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  on
                    ? "bg-white text-black"
                    : "border border-white/20 text-white/70 hover:border-white/40"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Transmission + seats + sort */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white/60">
            Transmission
            <select
              value={transmission}
              onChange={(e) => update({ transmission: e.target.value })}
              className={selectSx}
            >
              <option value="">Any</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-white/60">
            Min seats
            <select
              value={minSeats}
              onChange={(e) => update({ minSeats: e.target.value })}
              className={selectSx}
            >
              <option value="">Any</option>
              <option value="2">2+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
              <option value="7">7+</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-white/60">
            Sort
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
              className={selectSx}
            >
              <option value="">Default</option>
              <option value="distance">Nearest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </div>

        {/* Price range */}
        <div className="max-w-sm">
          <div className="mb-3 flex justify-between text-sm text-white/60">
            <span>Price / day</span>
            <span className="text-white/80">
              ${price[0]} – ${price[1]}
              {price[1] >= PRICE_MAX ? "+" : ""}
            </span>
          </div>
          <RangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={price}
            onChange={setPrice}
            onChangeCommitted={([lo, hi]) => {
              update({
                minPricePerDay: lo > PRICE_MIN ? String(lo) : null,
                maxPricePerDay: hi < PRICE_MAX ? String(hi) : null,
              });
            }}
          />
        </div>

        {anyActive && (
          <button
            onClick={clearAll}
            className="self-start text-sm text-white/50 underline-offset-2 hover:text-white hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </>
  );
}
