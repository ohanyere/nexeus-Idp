# Database Setup

This app uses PostgreSQL with Prisma for Phase 1 Service Catalog persistence.

## Run PostgreSQL Locally

```bash
docker run --name senior-idp-postgres \
  -e POSTGRES_USER=senior_idp \
  -e POSTGRES_PASSWORD=senior_idp \
  -e POSTGRES_DB=senior_idp \
  -p 5432:5432 \
  -d postgres:16
```

## Configure Environment

Set `DATABASE_URL` in `apps/web/.env.local` or the repo root `.env.local`:

```bash
DATABASE_URL="postgresql://senior_idp:senior_idp@localhost:5432/senior_idp?schema=public"
DIRECT_URL="postgresql://senior_idp:senior_idp@localhost:5432/senior_idp?schema=public"
```

For Neon-backed Vercel deployments, set `DATABASE_URL` to Neon's pooled connection
string for serverless runtime queries and set `DIRECT_URL` to the direct,
non-pooled connection string used by Prisma migrations.

## Generate Prisma Client

```bash
npm run prisma:generate -w apps/web
```

## Apply Committed Migrations

Use this for production, staging, and any existing database that should receive
committed migrations without creating a development migration:

```bash
npm run prisma:deploy -w apps/web
```

## Create a Migration

```bash
npm run prisma:migrate -w apps/web -- --name init_catalog
```

## Seed the Database

```bash
npm run prisma:seed -w apps/web
```

The seed creates sample users, teams, services, deployments, and audit log records. Runtime integrations remain mock-only.
