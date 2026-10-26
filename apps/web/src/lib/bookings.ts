import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  BookingRecordSchema,
  BookingHistorySchema,
  SESSION_COOKIE_NAME,
} from "@handoff/contracts";

async function request(path: string, returnTo: string) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  const response = await fetch(
    `${process.env.BFF_URL ?? "http://localhost:3001"}${path}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    },
  );
  if (response.status === 401)
    redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  if (response.status === 404) notFound();
  if (response.status === 400) return null;
  if (!response.ok) throw new Error("Could not load bookings");
  return response.json();
}

export async function getBooking(id: string, confirmation = false) {
  const data = await request(
    `/bookings/${encodeURIComponent(id)}`,
    `/bookings/${id}${confirmation ? "/confirmation" : ""}`,
  );
  return { booking: BookingRecordSchema.parse(data), now: Date.now() };
}

export async function getBookingHistory(cursor?: string | string[]) {
  const params = new URLSearchParams();
  if (cursor !== undefined)
    for (const value of Array.isArray(cursor) ? cursor : [cursor])
      params.append("cursor", value);
  const query = params.size ? `?${params}` : "";
  const data = await request(`/bookings${query}`, `/bookings${query}`);
  return data === null
    ? null
    : { ...BookingHistorySchema.parse(data), now: Date.now() };
}
