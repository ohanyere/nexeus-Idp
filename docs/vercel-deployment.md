# Vercel Deployment

This guide deploys `apps/web` to Vercel with GitHub OAuth, managed PostgreSQL, GitHub automation, and runtime integration warnings that fail closed when credentials are missing.

## Project Settings

- Root directory: `apps/web`
- Install command: `npm install`
- Build command: `npm run vercel-build`
- Output: Next.js default

The web package runs `prisma generate` from `postinstall`. The Vercel build command
runs `prisma generate` again, applies committed migrations with
`prisma migrate deploy` for production deployments, and then runs `next build`.
For the exact Neon production migration runbook, see
`docs/neon-production-migrations.md`.

If you deploy from the monorepo root instead, use:

```bash
npm run build -w apps/web
```

## Required Environment Variables

Set these in Vercel project settings for Production, Preview, and Development as appropriate.

```bash
NEXT_PUBLIC_AUTH_MODE=github
NEXTAUTH_URL=https://your-vercel-app.example.com
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GITHUB_OAUTH_TIMEOUT_MS=10000
DATABASE_URL=
DATABASE_URL_UNPOOLED=
GITHUB_TOKEN=
GITHUB_ORG=
GITHUB_TEMPLATE_OWNER=
GITHUB_TEMPLATE_REPO_GO_API=
GITHUB_TEMPLATE_REPO_NODE_API=
GITHUB_TEMPLATE_REPO_PYTHON_API=
GITHUB_TEMPLATE_REPO_NEXTJS_FRONTEND=
GITHUB_TEMPLATE_REPO_WORKER_SERVICE=
DOCKERHUB_USERNAME=
DOCKERHUB_TOKEN=
ARGOCD_BASE_URL=
ARGOCD_TOKEN=
KUBERNETES_API_URL=
KUBERNETES_BEARER_TOKEN=
```

Use a managed PostgreSQL database for `DATABASE_URL`; do not use localhost, Docker, or a workstation-only database for Vercel. Vercel Postgres, Neon, Supabase Postgres, RDS PostgreSQL, and Cloud SQL PostgreSQL are all suitable.

For Neon on Vercel, `DATABASE_URL` is the pooled connection string for runtime
serverless queries. Prisma uses the Vercel-managed `DATABASE_URL_UNPOOLED`
variable as the direct, non-pooled Neon connection for migration commands.

## GitHub OAuth

Create a GitHub OAuth app with:

- Homepage URL: the Vercel app URL
- Authorization callback URL: `https://your-vercel-app.example.com/api/auth/callback/github`

Then set:

- `AUTH_GITHUB_ID`: OAuth app client ID
- `AUTH_GITHUB_SECRET`: OAuth app client secret
- `AUTH_SECRET`: a long random secret for Auth.js session signing
- `NEXTAUTH_URL`: the canonical deployed URL
- `AUTH_GITHUB_OAUTH_TIMEOUT_MS`: optional OAuth callback HTTP timeout in milliseconds. The app defaults to `10000`, which raises the underlying Auth.js/OpenID client timeout above its `3500ms` default.

Local demo mode can use `NEXT_PUBLIC_AUTH_MODE=mock`; do not use mock mode for production.

In local development, especially on WSL or slow VPN/network connections, GitHub may authorize successfully and then the Auth.js callback can fail with `OAUTH_CALLBACK_ERROR outgoing request timed out after 3500ms` while exchanging the code or loading the GitHub profile. Keep `NEXT_PUBLIC_AUTH_MODE=github`, confirm `NEXTAUTH_URL=http://localhost:3000`, and raise `AUTH_GITHUB_OAUTH_TIMEOUT_MS` in `apps/web/.env.local` if `10000` is still too low. This setting only changes server-side outbound OAuth HTTP waits; it does not disable GitHub OAuth, remove state checks, or change the Vercel callback URL.

## Database

Run migrations against the managed database before a production demo or release:

```bash
npm run prisma:generate -w apps/web
npm run prisma:migrate:deploy -w apps/web
npm run prisma:seed -w apps/web
```

`prisma:migrate:deploy` uses `prisma migrate deploy`, which applies committed
migrations without creating new migration files. Keep `prisma:migrate` for local
development only, where `prisma migrate dev` is expected. `prisma:deploy` remains
as a compatibility alias.

Vercel production deployments run the same migration step automatically through
`npm run vercel-build`. Preview deployments skip migration application by default
so they do not accidentally mutate a shared production database.

## Runtime Integration Behavior

Missing runtime credentials do not produce fake success data. The app should show warnings or empty states such as:

- `Integration not configured`
- `No ArgoCD application found`
- `No runtime resources found`
- `No Crossplane claims found`
- `No PolicyReports found`

This is expected for a partially configured Vercel environment.

## Deployment Checklist

- `NEXT_PUBLIC_AUTH_MODE` is `github`.
- GitHub OAuth callback URL matches the deployed URL.
- `DATABASE_URL` points to managed PostgreSQL.
- `DATABASE_URL_UNPOOLED` points to the same database through Vercel's direct, non-pooled Neon connection.
- Prisma migrations have been applied to the target database.
- GitHub automation variables are present if Create Service, release snapshots, promotions, or rollbacks must be live.
- ArgoCD and Kubernetes variables are present if runtime state must be live.
- `npm run typecheck -w apps/web`, `npm run lint -w apps/web`, and `npm run build -w apps/web` pass locally before deploy.
