#!/bin/sh
set -eu
./node_modules/.bin/prisma migrate deploy
node dist/import-legacy.js
node dist/seed.js
