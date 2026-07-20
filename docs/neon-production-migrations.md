# Neon Production Migrations

Use this runbook when the Vercel production app uses Neon PostgreSQL and Prisma reports missing production tables.

## Root Cause

The app schema can contain the correct Prisma models while production still fails if committed migrations were never applied to the Neon production database. Running `npx prisma migrate deploy` without the Vercel/Neon production environment can load a local `DATABASE_URL`, such as `localhost:5432`, and leave the deployed Neon database unchanged.

## Current Repo Contract

- Prisma schema: `apps/web/prisma/schema.prisma`
- Migration directory: `apps/web/prisma/migrations`
- App package script: `npm run prisma:migrate:deploy -w apps/web`
- Vercel root directory: `apps/web`
- Vercel build command: `npm run vercel-build`

The Prisma datasource uses:

- `DATABASE_URL`: runtime PostgreSQL URL. For Neon on Vercel, use the pooled application URL.
- `DATABASE_URL_UNPOOLED`: Vercel-managed direct PostgreSQL URL. Prisma uses this non-pooled Neon URL for migration commands through `directUrl`.

Do not commit either value.

## Migration Evidence

- `20260613163153_init/migration.sql` creates `public."Service"` after `public."Team"` and then adds valid foreign keys for service-owned records.
- `20260701120000_gitops_infrastructure_provisioning/migration.sql` creates `public."InfrastructureProvisionRequest"` and `public."InfrastructureProvisionEvent"` before adding the event foreign key.
- `20260707132433_idp/migration.sql` only drops provisioning indexes; it does not create the provisioning tables and cannot fix a database that never received the earlier GitOps migration.

## Required Production Environment

These must be present in Vercel Production before running production migrations:

```bash
DATABASE_URL
DATABASE_URL_UNPOOLED
```

For Neon-backed Vercel projects, these are managed sensitive variables. Do not manually create a `DIRECT_URL` copy in Vercel, and do not paste connection strings into committed files or terminal output. For local execution through the Vercel CLI, run commands with `vercel env run -e production -- ...` so the managed values are loaded without exposing them.

## Commands

Audit that Vercel Production has both variables:

```bash
vercel env ls production
```

Check migration status against Neon Production:

```bash
vercel env run -e production -- npm run prisma:migrate:status -w apps/web
```

Apply pending migrations to Neon Production:

```bash
vercel env run -e production -- npm run prisma:migrate:deploy -w apps/web
```

Regenerate Prisma Client:

```bash
npm run prisma:generate -w apps/web
```

Verify the production tables exist and both Prisma models can be queried:

```bash
vercel env run -e production -- npm run prisma:verify:production -w apps/web
```

Verify migration status is up to date after applying:

```bash
vercel env run -e production -- npm run prisma:migrate:status -w apps/web
```

Redeploy Vercel Production after migration:

```bash
cd apps/web
vercel deploy --prod
```

After redeploy, verify the deployed app can query both models by opening:

```bash
https://YOUR_PRODUCTION_DOMAIN/services
https://YOUR_PRODUCTION_DOMAIN/infrastructure/provision-requests
```

Those pages exercise `Service` and `InfrastructureProvisionRequest` reads respectively. If auth protects them, verify after signing in with production GitHub auth.

## Safety Rules

Do not run:

```bash
prisma migrate reset
prisma db push --force-reset
```

Do not drop tables, drop schemas, delete the Neon database, or recreate the Neon database to resolve this issue.
