import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 moved the connection URL out of schema.prisma into this file.
// The CLI (migrate/generate) reads `datasource.url` from here.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
