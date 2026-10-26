export function safeReturnTo(value: unknown): string {
  return typeof value === "string" &&
    /^\/(?:vehicles\/[a-zA-Z0-9_-]+|bookings\/[a-zA-Z0-9_-]+\/confirmation)(?:\?[^\\#]*)?$/.test(
      value,
    )
    ? value
    : "/vehicles";
}
