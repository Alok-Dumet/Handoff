import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const importId = "rental-identity-v1";
// Explicit, one-time migration only. Neither runtime service receives credentials
// for the other's database. Old writers must be stopped during this snapshot.
export async function importLegacyIdentity(
  target: PrismaClient,
  sourceUrl: string,
) {
  if (await target.identityImport.findUnique({ where: { id: importId } }))
    return;
  const source = new PrismaClient({
    adapter: new PrismaPg({ connectionString: sourceUrl }),
  });
  try {
    const snapshot = await source.$transaction(
      async (tx) => {
        const [tables] = await tx.$queryRaw<
          Array<{ users: string | null; sessions: string | null }>
        >`
        SELECT to_regclass('public.users')::text AS users, to_regclass('public.sessions')::text AS sessions`;
        if (!tables.users && !tables.sessions)
          return { users: [], sessions: [] };
        if (!tables.users || !tables.sessions)
          throw new Error("Incomplete legacy identity schema");
        return {
          users: await tx.user.findMany(),
          sessions: await tx.session.findMany(),
        };
      },
      { isolationLevel: "RepeatableRead", timeout: 60000 },
    );
    await target.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(781264901)`;
        if (await tx.identityImport.findUnique({ where: { id: importId } }))
          return;
        if ((await tx.user.count()) || (await tx.session.count())) {
          throw new Error(
            "Identity database is populated without an import marker; refusing to merge or overwrite accounts",
          );
        }
        if (snapshot.users.length)
          await tx.user.createMany({ data: snapshot.users });
        if (snapshot.sessions.length)
          await tx.session.createMany({ data: snapshot.sessions });
        await tx.identityImport.create({ data: { id: importId } });
      },
      { timeout: 60000 },
    );
  } finally {
    await source.$disconnect();
  }
}
