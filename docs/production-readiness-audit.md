# Production Readiness Audit

Date: 2026-07-01

This audit inspected the current `senior-idp-platform` workspace for production readiness, mock boundaries, required integrations, Vercel readiness, and local dependencies. No application behavior was changed.

## Executive answer

Can this deploy to Vercel today?

Yes for a controlled demo deployment, if Vercel is configured for the `apps/web` workspace and all required environment variables point to real external services. No for production or job-application-grade usage as-is, because authentication, signup, RBAC enforcement, infrastructure provisioning, governance results, topology, resource explorer, notifications, logs, and broad search are still mock-only or mostly mock-only.

What database should be used for production?

Use a managed PostgreSQL database. The app already uses Prisma with a PostgreSQL datasource, so the lowest-friction choices are Vercel Postgres, Neon, Supabase Postgres, AWS RDS PostgreSQL, or Cloud SQL PostgreSQL. For a Vercel-hosted demo, Neon or Vercel Postgres are the simplest fit. Do not use local Docker Postgres for Vercel or production.

Is signup real or mock?

Signup is not implemented as a real flow. The current login page writes a mock session to browser localStorage. There is no real user registration, password verification, email verification, provider callback, invite acceptance, or persisted session creation.

Should Auth.js, Firebase, or Supabase Auth be used?

Use Auth.js for this app unless the product direction intentionally moves all auth and database ownership to Supabase. Auth.js fits the existing Next.js app, GitHub OAuth requirement, Prisma/Postgres model, and enterprise IDP direction. Supabase Auth is reasonable if you choose Supabase Postgres and want hosted auth quickly. Firebase Auth is the least aligned with the current Prisma/Postgres, GitHub/GitOps, and enterprise RBAC shape.

## Real integrations

- Service catalog persistence uses Prisma and PostgreSQL through `DATABASE_URL`.
- Create Service can call GitHub through Octokit to generate or reuse a repository from a template, personalize files, configure Docker Hub Actions secrets, add fleet discovery topics, register fleet metadata, and persist the created service.
- Release management for catalog-backed services can read GitHub repository overlays and open promotion PRs through Octokit.
- Rollback can find a previous overlay image tag and open a rollback PR through Octokit.
- Deployment listing is partially real: it prefers persisted catalog services and GitHub overlay snapshots, then falls back to demo release data when no persisted services exist or release state cannot be loaded.
- Secret encryption for GitHub Actions secrets uses `libsodium-wrappers` server-side.

## Mock-only areas

- Authentication/login is mock-only. Provider buttons only activate a mock localStorage session.
- Signup is absent.
- Session persistence is localStorage-only and not server trusted.
- RBAC is client-side mock role selection. It hides UI controls but does not protect API routes.
- Infrastructure provisioning UI is mock-only and explicitly states that no Crossplane, Kubernetes, AWS, or Terraform call runs.
- Governance UI is typed fixture data from `apps/web/src/lib/governance.ts`; it is not reading Kyverno, OPA Gatekeeper, CI scan output, or cluster policy reports.
- Resource explorer is generated from mock deployment/resource data and is shaped for a later Kubernetes API adapter.
- Topology is mock graph data from `apps/web/src/components/topology/mockTopology.ts`, optionally enriched with mock provisioned resources.
- Deployment detail, release timeline, and log panels are mock operational records.
- Notifications are static mock notifications.
- Topbar search is visual placeholder text, not a real global search feature.
- API keys, invites, settings, scorecards, cost views, drift, platform health, and disaster recovery appear to be demo/mock surfaces.

## Partially real areas

- Service catalog: `/api/services` reads Prisma, while `/services` falls back to mock services if the database is unavailable or empty.
- Create Service: real GitHub and real database paths exist, but missing GitHub configuration drops the route into mock/demo repository output. Some enrichment steps are warning-only by design.
- Deployments/release management: catalog-backed rows and GitHub overlay snapshots are real when database and GitHub are configured; demo rows remain the fallback.
- Promotion and rollback: API routes create PRs through GitHub, but caller identity and authorization are not real yet.
- Audit log: Create Service and promotion/rollback can write audit rows, but many UI audit/timeline views still read mock data.
- Database usage: Prisma models cover users, teams, services, environments, capabilities, deployments, and audit logs. They do not yet cover durable auth sessions, OAuth accounts, resource claims, policy results, topology, notifications, search indexes, or governance findings.

## Required environment variables

Required for database-backed service catalog:

- `DATABASE_URL`

Required for GitHub repository creation, template personalization, fleet registration, release snapshots, promotions, and rollbacks:

- `GITHUB_TOKEN`
- `GITHUB_ORG`
- `GITHUB_TEMPLATE_OWNER`
- `GITHUB_TEMPLATE_REPO_GO_API`
- `GITHUB_TEMPLATE_REPO_NODE_API`
- `GITHUB_TEMPLATE_REPO_PYTHON_API`
- `GITHUB_TEMPLATE_REPO_NEXTJS_FRONTEND`
- `GITHUB_TEMPLATE_REPO_WORKER_SERVICE`

Required for configuring generated repository CI secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Needed once GitHub OAuth is made real:

- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `AUTH_URL` or `NEXTAUTH_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Likely needed for real Crossplane and governance integrations:

- Kubernetes API endpoint and service account credentials, or an in-cluster identity for an API worker
- Target cluster name/context
- Crossplane claim namespace and allowed compositions
- Kyverno PolicyReport/ClusterPolicyReport read credentials
- OPA Gatekeeper constraint/status read credentials, if Gatekeeper is used

## Vercel blockers

- Production auth is not implemented. Vercel can host the UI, but access control would be demo-only.
- `DATABASE_URL` must point to managed PostgreSQL, not localhost or Docker.
- Vercel must receive every GitHub and Docker Hub secret listed above for real service creation and release operations.
- There is no explicit Vercel config in the repo. Configure Vercel with `apps/web` as the app root, or set the build command to target the workspace.
- Prisma generation must be reliable in Vercel builds. The current package has `prisma:generate`, but no `postinstall` or build pre-step that guarantees generation on Vercel. Recommended build command: `npm run prisma:generate -w apps/web && npm run build -w apps/web`, or add an equivalent package script before production deployment.
- Mutation APIs are not server-authorized. `/api/services/create`, `/api/promotions`, and `/api/rollbacks` validate request shape but do not enforce a real authenticated user, tenant, team, or permission.
- Crossplane, Kubernetes, Kyverno, OPA, ArgoCD, Argo Rollouts, Loki, Prometheus, and notification providers are not connected.
- Some static/demo pages are acceptable for portfolio demos, but they should be clearly labeled or replaced before a production-readiness demo.

## Local Docker/Postgres dependencies

Local development currently expects PostgreSQL 16 via Docker for persistence:

```bash
docker run --name senior-idp-postgres \
  -e POSTGRES_USER=senior_idp \
  -e POSTGRES_PASSWORD=senior_idp \
  -e POSTGRES_DB=senior_idp \
  -p 5432:5432 \
  -d postgres:16
```

Then configure:

```bash
DATABASE_URL="postgresql://senior_idp:senior_idp@localhost:5432/senior_idp?schema=public"
```

Local database commands:

```bash
npm run prisma:generate -w apps/web
npm run prisma:migrate -w apps/web
npm run prisma:seed -w apps/web
```

## What must change for GitHub OAuth login

- Add Auth.js dependencies and an auth route such as `app/api/auth/[...nextauth]/route.ts`.
- Configure the GitHub provider with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`, and `AUTH_URL`.
- Add a production session strategy, preferably Prisma adapter tables if server-side revocation and account linkage matter.
- Replace `MockSessionContext`, `AuthGate`, localStorage session reads, and login button mock handlers with Auth.js `signIn`, `signOut`, and server session reads.
- Move authorization checks to server routes, server components, middleware, or a shared server helper. UI hiding can stay, but it cannot be the enforcement boundary.
- Map GitHub identity to app users, teams, roles, and environment access. This can be done from allowed org/team membership, a maintained user/team table, or an admin invitation flow.
- Remove the mock role selector from production builds.

## What must change for real Crossplane claim submission

- Add durable Prisma models for resource offerings, resource claims, resource claim events, approvals, provisioned resources, and service/resource bindings.
- Create a server API route for claim submission that requires a real authenticated user and checks `create resource` permission on the server.
- Translate approved catalog items into Crossplane claim manifests with allowed composition refs, namespace, labels, owner, service ID, environment, cost center, and parameters.
- Submit claims through a secure backend integration, not from the browser. Options include Kubernetes API from a trusted worker, a GitOps PR into a claims repository, or an internal provisioning service.
- Watch claim conditions and managed resource status, then persist status transitions and events back to Postgres.
- Replace `ProvisionResourceButton` mock completion with API submission, pending/approved/provisioning/ready/failed states, and audit log writes.
- Define failure behavior and rollback/cleanup for rejected or failed claims.

## What must change for real governance results

- Add a governance ingestion layer for Kyverno `PolicyReport` and `ClusterPolicyReport`, OPA Gatekeeper constraint statuses, and CI scan/Conftest outputs.
- Persist policy catalog metadata, policy results, violations, exceptions, remediation state, and service mappings in Postgres.
- Map findings to services by repository, namespace, labels, owner, environment, and workload name.
- Replace fixture reads in `apps/web/src/lib/governance.ts` with server-side adapters and database-backed queries.
- Add background refresh or webhook ingestion so governance does not depend on page render time cluster calls.
- Keep semantic status colors and the current typed UI model, but treat mock data only as empty-state/demo fallback.
- Enforce access controls for governance details if team-scoped visibility is required.

## Recommended production sequence

1. Add Auth.js GitHub OAuth and server-enforced RBAC.
2. Move Vercel to managed Postgres and make Prisma generation part of the build.
3. Protect mutation APIs with authenticated user, tenant/team scope, and permission checks.
4. Replace infrastructure provisioning mock submission with persisted Crossplane claims.
5. Replace governance fixtures with Kyverno/OPA/CI result ingestion.
6. Replace mock deployment details/logs/resource explorer/topology with adapters or clearly labeled demo fallbacks.
7. Add a real notification pipeline for approvals, promotions, rollbacks, and policy findings.
8. Add real global search backed by database queries or a search index.

## Demo readiness summary

The app is strong as an IDP portfolio demo if the demo story explicitly says which parts are real:

- Real: GitHub repository generation path, persisted service catalog, GitHub promotion/rollback PR path, Prisma/Postgres persistence.
- Demo fallback: release rows when no catalog data exists, mock operational logs, governance, infrastructure, topology, notifications, search, and auth.
- Not production-ready: identity, authorization, provisioning, governance evidence, cluster state, notification delivery, and deployment/log observability.
