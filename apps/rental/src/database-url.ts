/** The bundled Compose database works locally without credentials from a provider. */
export function databaseUrl(env = process.env): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
  return "postgresql://handoff:handoff@localhost:5432/refdata";
}
