import type { Vehicle } from "@handoff/contracts";

const BFF_URL = process.env.BFF_URL ?? "http://localhost:3002";

async function getVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${BFF_URL}/vehicles`, { cache: "no-store" });
  if (!res.ok) throw new Error(`BFF responded ${res.status}`);
  return res.json();
}

export default async function Home() {
  const vehicles = await getVehicles();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
      <h1>Available vehicles</h1>
      <ul>
        {vehicles.map((v) => (
          <li key={v.id}>
            {v.year} {v.make} {v.model} — {v.category} —{" "}
            {(v.pricePerDay / 100).toLocaleString("en-US", {
              style: "currency",
              currency: v.currency,
            })}
            /day — {v.seats} seats — {v.location}
          </li>
        ))}
      </ul>
    </main>
  );
}
