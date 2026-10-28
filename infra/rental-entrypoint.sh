#!/bin/sh
set -eu

# Fail startup if migration/initialization fails. No schema reset or overwrites.
./node_modules/.bin/prisma migrate deploy
node dist/seed.js
exec node dist/main.js
