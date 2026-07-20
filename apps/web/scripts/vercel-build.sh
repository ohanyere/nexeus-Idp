#!/bin/sh
set -eu

if [ "${VERCEL_ENV:-}" = "production" ] && [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL is required for production Prisma migrations."
  exit 1
fi

npm run prisma:generate

if [ "${VERCEL_ENV:-}" = "production" ]; then
  npm run prisma:deploy
else
  echo "Skipping Prisma migrations because VERCEL_ENV is '${VERCEL_ENV:-unset}'."
fi

npm run build
