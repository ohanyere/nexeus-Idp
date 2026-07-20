#!/bin/sh
set -eu

if [ "${VERCEL_ENV:-}" = "production" ] && [ -z "${DATABASE_URL_UNPOOLED:-}" ]; then
  echo "DATABASE_URL_UNPOOLED is required for production Prisma migrations."
  exit 1
fi

npm run prisma:generate

if [ "${VERCEL_ENV:-}" = "production" ]; then
  npm run prisma:deploy
else
  echo "Skipping Prisma migrations because VERCEL_ENV is '${VERCEL_ENV:-unset}'."
fi

npm run build
