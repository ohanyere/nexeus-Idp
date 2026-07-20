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

if [ -z "${DATABASE_URL_UNPOOLED:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL_UNPOOLED="$DATABASE_URL"
fi

if [ -z "${DATABASE_URL_UNPOOLED:-}" ]; then
  database_url=$(read_database_url)
  if [ -n "$database_url" ]; then
    export DATABASE_URL_UNPOOLED="$database_url"
  fi
fi

prisma generate
