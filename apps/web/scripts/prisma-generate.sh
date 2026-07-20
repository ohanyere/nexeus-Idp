#!/bin/sh
set -eu

read_database_url() {
  for env_file in .env .env.local; do
    if [ -f "$env_file" ]; then
      value=$(sed -n 's/^DATABASE_URL=//p' "$env_file" | tail -n 1)
      value=${value#\"}
      value=${value%\"}
      value=${value#\'}
      value=${value%\'}
      if [ -n "$value" ]; then
        printf '%s' "$value"
        return
      fi
    fi
  done
}

if [ -z "${DIRECT_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

if [ -z "${DIRECT_URL:-}" ]; then
  database_url=$(read_database_url)
  if [ -n "$database_url" ]; then
    export DIRECT_URL="$database_url"
  fi
fi

prisma generate
