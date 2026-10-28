import "dotenv/config";
import { PrismaService } from "./prisma/prisma.service";
import { importLegacyIdentity } from "./legacy-import";
async function main() {
  const sourceUrl =
    process.env.LEGACY_IDENTITY_DATABASE_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "postgresql://handoff:handoff@localhost:5432/refdata");
  if (!sourceUrl)
    throw new Error(
      "LEGACY_IDENTITY_DATABASE_URL is required for the migration job",
    );
  const target = new PrismaService();
  try {
    await importLegacyIdentity(target, sourceUrl);
    console.log("Identity import complete (or previously applied)");
  } finally {
    await target.$disconnect();
  }
}
void main().catch(() => {
  console.error(
    "Identity import failed; no partial import was committed. Check database readiness and ensure the destination was not seeded before import.",
  );
  process.exitCode = 1;
});
