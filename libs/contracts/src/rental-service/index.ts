export function rentalServiceKey(
  env: Record<string, string | undefined>,
): string {
  if (env.RENTAL_SERVICE_KEY) return env.RENTAL_SERVICE_KEY;
  if (env.NODE_ENV === "production")
    throw new Error("RENTAL_SERVICE_KEY is required");
  return "handoff-local-rental-key";
}
