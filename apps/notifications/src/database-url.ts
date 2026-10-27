export function databaseUrl(env = process.env): string {
  if (env.NOTIFICATIONS_DATABASE_URL) return env.NOTIFICATIONS_DATABASE_URL;
  if (env.NODE_ENV === "production")
    throw new Error("NOTIFICATIONS_DATABASE_URL is required");
  return "postgresql://notifications:notifications@localhost:5433/notifications";
}
