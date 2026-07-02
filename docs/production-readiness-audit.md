# Production Readiness Audit

Date: 2026-07-02

This audit inspected the current `senior-idp-platform` workspace for production readiness, mock boundaries, required integrations, Vercel readiness, and local dependencies. No application behavior was changed.

## Executive answer

Can this deploy to Vercel today?

Yes for a controlled deployment, if Vercel is configured for the `apps/web` workspace and all required environment variables point to real external services. GitHub OAuth is implemented through Auth.js, but API route authorization, signup/invitations, notifications, broad search, and several operational integrations still need production hardening.

What database should be used for production?

Use a managed PostgreSQL database. The app already uses Prisma with a PostgreSQL datasource, so the lowest-friction choices are Vercel Postgres, Neon, Supabase Postgres, AWS RDS PostgreSQL, or Cloud SQL PostgreSQL. For a Vercel-hosted demo, Neon or Vercel Postgres are the simplest fit. Do not use local Docker Postgres for Vercel or production.

Is signup real or mock?

Signup is not implemented as a real flow. Production login uses Auth.js with GitHub OAuth. Local mock login is only available when `NEXT_PUBLIC_AUTH_MODE=mock`. There is no real user registration, email verification, invite acceptance, or durable account-management flow yet.

Should Auth.js, Firebase, or Supabase Auth be used?

Use Auth.js for this app unless the product direction intentionally moves all auth and database ownership to Supabase. Auth.js fits the existing Next.js app, GitHub OAuth requirement, Prisma/Postgres model, and enterprise IDP direction. Supabase Auth is reasonable if you choose Supabase Postgres and want hosted auth quickly. Firebase Auth is the least aligned with the current Prisma/Postgres, GitHub/GitOps, and enterprise RBAC shape.

## Real integrations

- Service catalog persistence uses Prisma and PostgreSQL through `DATABASE_URL`.
- Authentication uses Auth.js GitHub OAuth when `NEXT_PUBLIC_AUTH_MODE=github`.
- Create Service can call GitHub through Octokit to generate or reuse a repository from a template, personalize files, configure Docker Hub Actions secrets, add fleet discovery topics, register fleet metadata, and persist the created service.
- Release management for catalog-backed services can read GitHub repository overlays and open promotion PRs through Octokit.
- Rollback can find a previous overlay image tag and open a rollback PR through Octokit.
- Deployment listing is partially real: it prefers persisted catalog services and GitHub overlay snapshots, then falls back to demo release data when no persisted services exist or release state cannot be loaded.
- Secret encryption for GitHub Actions secrets uses `libsodium-wrappers` server-side.

## Mock-only areas

- Signup is absent.
- Local demo login is mock-only and gated by `NEXT_PUBLIC_AUTH_MODE=mock`.
- RBAC is preserved through mapped mock/team records after GitHub login. It still hides UI controls but does not protect mutation API routes yet.
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
- Database usage: Prisma models cover users, teams, services, environments, capabilities, deployments, and audit logs. Auth.js currently uses JWT sessions, so Prisma does not yet store OAuth accounts or revocable server-side sessions.

## Required environment variables

Required for auth mode:

- `NEXT_PUBLIC_AUTH_MODE`

Required for Auth.js GitHub OAuth:

- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

Required for database-backed service catalog and Vercel managed Postgres:

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

Required for ArgoCD runtime/release state:

- `ARGOCD_BASE_URL`
- `ARGOCD_TOKEN`

Required for Kubernetes, Crossplane, and Kyverno runtime reads:

- `KUBERNETES_API_URL`
- `KUBERNETES_BEARER_TOKEN`
- Target cluster name/context
- Crossplane claim namespace and allowed compositions
- Kyverno PolicyReport/ClusterPolicyReport read credentials
- OPA Gatekeeper constraint/status read credentials, if Gatekeeper is used

## Vercel blockers

- `DATABASE_URL` must point to managed PostgreSQL, not localhost or Docker.
- Vercel must receive every Auth.js, GitHub, ArgoCD, Kubernetes, and Docker Hub secret listed above for real login, service creation, release operations, and runtime reads.
- There is no explicit Vercel config in the repo. Configure Vercel with `apps/web` as the app root, or set the build command to target the workspace.
- Prisma generation runs from the `apps/web` `postinstall` script. Recommended build command remains `npm run build -w apps/web` from the repository root or `npm run build` when Vercel root is `apps/web`.
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

## Remaining auth hardening

- Move authorization checks to server routes, server components, middleware, or a shared server helper. UI hiding can stay, but it cannot be the enforcement boundary.
- Replace temporary GitHub-to-mock-user mapping with durable user/team records, GitHub org/team membership checks, or an admin invitation flow.
- Add Auth.js Prisma adapter tables if server-side revocation and OAuth account linkage matter.
- Remove the role selector from production builds after team/role administration is real.

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

1. Add server-enforced RBAC to mutation APIs using the Auth.js session.
2. Move Vercel to managed Postgres and run migrations/seeding intentionally for the target environment.
3. Replace temporary GitHub-to-mock-user mapping with durable users, teams, invitations, and org/team checks.
4. Replace infrastructure provisioning mock submission with persisted Crossplane claims.
5. Replace governance fixtures with Kyverno/OPA/CI result ingestion.
6. Replace mock deployment details/logs/resource explorer/topology with adapters or clearly labeled demo fallbacks.
7. Add a real notification pipeline for approvals, promotions, rollbacks, and policy findings.
8. Add real global search backed by database queries or a search index.

## Demo readiness summary

The app is strong as an IDP portfolio demo if the demo story explicitly says which parts are real:

- Real: Auth.js GitHub OAuth, GitHub repository generation path, persisted service catalog, GitHub promotion/rollback PR path, Prisma/Postgres persistence.
- Demo fallback: release rows when no catalog data exists, mock operational logs, governance, infrastructure, topology, notifications, search, and local mock login when `NEXT_PUBLIC_AUTH_MODE=mock`.
- Not production-ready: server-enforced authorization, durable user administration, provisioning, governance evidence, cluster state, notification delivery, and deployment/log observability.
