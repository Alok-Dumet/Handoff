export function databaseUrl(env = process.env): string {
  if (env.IDENTITY_DATABASE_URL) return env.IDENTITY_DATABASE_URL;
  if (env.NODE_ENV === "production")
    throw new Error("IDENTITY_DATABASE_URL is required");
  return "postgresql://identity:identity@localhost:5434/identity";
}
