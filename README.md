# Nexus Internal Developer Platform

A GitOps-oriented developer portal and control plane for platform engineering teams.

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white) ![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=0B1F33) ![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white) ![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white) ![Kubernetes API](https://img.shields.io/badge/Kubernetes-API-326CE5?logo=kubernetes&logoColor=white)

[Getting started](#getting-started) · [Architecture](#architecture) · [Workflow](#developer-workflow) · [Testing](#testing-and-validation) · [Security](#security-and-limitations)

Nexus gives application teams one place to create cataloged services from approved templates, open release and infrastructure GitOps requests, and inspect available runtime state. It coordinates GitHub, Argo CD, Kubernetes, Crossplane, and Kyverno without replacing their control loops: Nexus records intent and metadata, Git repositories hold desired state, and platform controllers reconcile it.

> **Status:** portfolio/reference implementation. Provider-backed code paths coexist with reference-data screens, and mutation APIs are not yet a production authorization boundary.

## Capability status

| Status | Capability | Current behavior | Source |
| --- | --- | --- | --- |
| Implemented | Authentication | Auth.js GitHub OAuth with JWT sessions; explicit local mock mode | [`auth-options.ts`](apps/web/src/lib/server/auth-options.ts) |
| Implemented | Catalog | Prisma-backed teams, services, environments, capabilities, deployments, and audit records | [`schema.prisma`](apps/web/prisma/schema.prisma), [`catalog.ts`](apps/web/src/lib/server/catalog.ts) |
| Implemented | Golden paths | GitHub template generation with personalized repository and gated initialization | [`services/create/route.ts`](apps/web/src/app/api/services/create/route.ts) |
| Implemented | Releases | GitHub-backed release snapshots, promotion PRs, and rollback PRs | [`promotion-service.ts`](apps/web/src/lib/server/promotion-service.ts) |
| Implemented | Infrastructure | Persisted requests and GitOps pull requests for five Crossplane claim types | [`infrastructure-provisioning.ts`](apps/web/src/lib/server/infrastructure-provisioning.ts) |
| Implemented | Runtime reads | Reads GitHub, Argo CD, Kubernetes, Argo Rollouts, Crossplane, and Kyverno state | [`runtime-status.ts`](apps/web/src/lib/server/runtime-status.ts) |
| Demo-backed | Catalog fallback and dashboards | Uses typed reference services, activity, ownership, and team data when authoritative data is absent | [`services/page.tsx`](apps/web/src/app/%28portal%29/services/page.tsx), [`mock-data.ts`](apps/web/src/lib/mock-data.ts) |
| Demo-backed | Deployment details | Detail logs, rollout history, and generic deploy dialogs are fixtures or request previews; promotion and rollback APIs are real | [`DeploymentActions.tsx`](apps/web/src/components/DeploymentActions.tsx) |
| Demo-backed | Operations and administration | Topology, costs, scorecards, drift, platform health, disaster recovery, invitations, API keys, and most settings are reference surfaces | [`mock-data.ts`](apps/web/src/lib/mock-data.ts), [`InviteMemberButton.tsx`](apps/web/src/components/InviteMemberButton.tsx) |
| Hybrid | Governance and resources | Kyverno findings and five claim types are live-capable; policy definitions and additional resource offerings are reference data | [`governance/page.tsx`](apps/web/src/app/%28portal%29/governance/page.tsx), [`infrastructure.ts`](apps/web/src/lib/infrastructure.ts) |
| Planned | Production controls | Server-enforced tenancy/RBAC, durable identity administration, background processing, live observability, notification delivery, and global search | [Security limitations](#security-and-limitations) |

“Planned” identifies an implementation gap, not a release commitment.

“Implemented” means the configured code path performs a persistence or provider operation. It does not mean the workflow has been validated end to end against production infrastructure; validated scope is listed under [Testing](#testing-and-validation) and [Security](#security-and-limitations).

## Architecture

Nexus is a modular Next.js application. The [App Router](apps/web/src/app) provides UI and server-rendered pages, [route handlers](apps/web/src/app/api) expose application operations, [server modules](apps/web/src/lib/server) isolate provider logic, and [Prisma](apps/web/prisma/schema.prisma) persists platform metadata and workflow records.

```mermaid
flowchart LR
    User[Developer or platform engineer]

    subgraph Nexus["Nexus IDP"]
        Web[Next.js portal]
        Auth[Auth.js route]
        API[Application routes]
        Adapters[Server integrations]
        DB[(PostgreSQL / Prisma)]
        Web --> Auth
        Web --> API
        API --> Adapters
        Adapters --> DB
    end

    subgraph GitHub["GitHub API targets"]
        OAuth[GitHub OAuth]
        Repos[Generated repositories]
        Core[ohanyere/platform-core]
        Runs[Actions workflow runs]
    end

    subgraph Runtime["Read-only runtime APIs"]
        Argo[Argo CD Applications]
        Kube[Kubernetes workloads,<br/>Rollouts, claims, PolicyReports]
    end

    User --> Web
    Auth --> OAuth
    Adapters -->|create, read, update| Repos
    Adapters -->|write fleet registrations| Core
    Adapters -.->|poll| Runs
    Adapters -.->|read| Argo
    Adapters -.->|read| Kube
```

Every edge is implemented in [`auth-options.ts`](apps/web/src/lib/server/auth-options.ts), [`github.ts`](apps/web/src/lib/server/github.ts), [`catalog.ts`](apps/web/src/lib/server/catalog.ts), [`infrastructure-provisioning.ts`](apps/web/src/lib/server/infrastructure-provisioning.ts), or [`runtime-status.ts`](apps/web/src/lib/server/runtime-status.ts). External Argo CD-to-cluster and Crossplane-to-cloud reconciliation is intentionally not diagrammed.

| Boundary | Nexus owns | External source of truth |
| --- | --- | --- |
| Catalog | Ownership, repository metadata, workflow history, and audit records | PostgreSQL |
| Source and desired state | Repository creation and Git mutations | GitHub service repositories |
| Fleet discovery | Registration files written by Nexus | `ohanyere/platform-core` |
| Delivery | Promotion/rollback intent and provider status reads | GitHub Actions, Argo CD, Kubernetes |
| Infrastructure | Claim generation and request history | Service GitOps overlays, Crossplane |

### `platform-core` relationship

Nexus writes one registration per environment directly to `ohanyere/platform-core` on `main` ([source](apps/web/src/lib/server/github.ts)):

```text
gitops/fleet/services/{dev,stage,prod}/<service>.yaml
```

Each registration points to `k8s/overlays/<environment>` in the generated repository and assigns `<service>-<environment>` as the namespace. The owner, repository, branch, and three-environment set are currently hardcoded. Fleet content also assumes `https://github.com/ohanyere/<service>.git`, even though repository creation uses `GITHUB_ORG`.

## Platform integration contracts

### Golden paths and reusable workflows

Template repositories are configured with `GITHUB_TEMPLATE_REPO_GO_API`, `GITHUB_TEMPLATE_REPO_NODE_API`, `GITHUB_TEMPLATE_REPO_PYTHON_API`, `GITHUB_TEMPLATE_REPO_NEXTJS_FRONTEND`, and `GITHUB_TEMPLATE_REPO_WORKER_SERVICE`.

Templates own their `.github/workflows` files and any reusable `jobs.<job>.uses` references. Nexus preserves those references; it does not select the workflow repository, validate inputs, or enforce ref pinning. It does require every copied workflow to contain `.idp/repository-initialized` and `IDP_REPOSITORY_INITIALIZED`, then withholds the marker until personalization, Docker Hub secrets, fleet registration, and catalog persistence succeed ([bootstrap](apps/web/src/lib/server/github-bootstrap.ts), [personalization](apps/web/src/lib/server/github-personalization.ts)).

Supported placeholders are `__SERVICE_NAME__`, `__SERVICE_SLUG__`, `__DOCKER_IMAGE__`, `__TEAM_NAME__`, `__OWNER_EMAIL__`, `__ENVIRONMENT__`, `__COST_CENTER__`, and the legacy `**SERVICE_NAME**`. Nexus scans the generated tree and stops initialization if recognized placeholders remain. It also writes encrypted `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets.

### Infrastructure contract

Claims use `apiVersion: platform.ohanyere.com/v1alpha1` and are written to `k8s/overlays/<environment>/claims/<claim>.yaml` ([source](apps/web/src/lib/server/infrastructure-provisioning.ts)).

| Resource | Kind | Composition |
| --- | --- | --- |
| PostgreSQL | `PostgreSQLInstance` | `postgresql.aws.platform.ohanyere.com` |
| Redis | `RedisInstance` | `redis.aws.platform.ohanyere.com` |
| S3 | `ObjectBucket` | `objectbucket.aws.platform.ohanyere.com` |
| SQS | `MessageQueue` | `messagequeue.aws.platform.ohanyere.com` |
| DynamoDB | `DynamoDBTable` | `dynamodb.aws.platform.ohanyere.com` |

Claims include team, cost-center, environment, provisioner, and optional service labels. `platform-core` must supply compatible XRDs/compositions, the overlay must include the claim, and Argo CD/Crossplane must reconcile it. Nexus does not validate the XRD against a live cluster before opening the pull request.

## Technology and layout

| Layer | Implementation |
| --- | --- |
| Application | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, Lucide, React Flow, Sonner |
| Authentication | Auth.js / NextAuth.js, GitHub OAuth, JWT sessions |
| Persistence | PostgreSQL, Prisma 6, committed migrations |
| Automation | Octokit, GitHub templates, Actions secrets and pull requests |
| Runtime reads | Argo CD REST API and Kubernetes API |
| Deployment | Vercel-compatible workspace build |

```text
apps/web/
├── prisma/          # schema, migrations, seed
├── scripts/         # Prisma and Vercel helpers
└── src/
    ├── app/         # pages and API routes
    ├── components/  # portal UI
    └── lib/         # domain data and server integrations
docs/                # runtime and deployment runbooks
```

## Getting started

### Prerequisites

- Node.js 22+ and npm 10+
- PostgreSQL; the example below uses Docker and `postgres:16`
- GitHub/provider credentials only for live integration paths

Configure the web workspace before installing because `postinstall` generates Prisma Client ([script](apps/web/scripts/prisma-generate.sh)):

```bash
git clone https://github.com/ohanyere/nexeus-Idp.git
cd nexeus-Idp
cp .env.example apps/web/.env
```

Minimum local evaluation configuration:

```dotenv
NEXT_PUBLIC_AUTH_MODE=mock
DATABASE_URL="postgresql://nexus:nexus@localhost:5432/nexus?schema=public"
DATABASE_URL_UNPOOLED="postgresql://nexus:nexus@localhost:5432/nexus?schema=public"
```

Prisma CLI loads `apps/web/.env`, not `.env.local`. The two database URLs can match locally; use pooled and direct URLs respectively for serverless PostgreSQL.

```bash
npm install

docker run --name nexus-postgres \
  -e POSTGRES_USER=nexus \
  -e POSTGRES_PASSWORD=nexus \
  -e POSTGRES_DB=nexus \
  -p 5432:5432 \
  -d postgres:16

npm run prisma:generate -w apps/web
npm run prisma:deploy -w apps/web
npm run prisma:seed -w apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run prisma:migrate -w apps/web` instead of `prisma:deploy` when creating a schema migration locally.

### Configuration

See [`.env.example`](.env.example) for the complete list.

| Area | Variables | Enables |
| --- | --- | --- |
| Auth | `NEXT_PUBLIC_AUTH_MODE`, `NEXTAUTH_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Mock or GitHub login |
| Database | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Runtime queries and migrations |
| GitHub | `GITHUB_TOKEN`, `GITHUB_ORG`, `GITHUB_TEMPLATE_OWNER`, `GITHUB_TEMPLATE_REPO_*` | Golden paths, releases, provisioning |
| Registry | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Generated-repository Actions secrets |
| Argo CD | `ARGOCD_BASE_URL`, `ARGOCD_TOKEN` | Application status reads |
| Kubernetes | `KUBERNETES_API_URL`, `KUBERNETES_BEARER_TOKEN` | Workloads, claims, Rollouts, Kyverno reads |

For local GitHub OAuth, set `NEXT_PUBLIC_AUTH_MODE=github`, `NEXTAUTH_URL=http://localhost:3000`, and use callback URL `http://localhost:3000/api/auth/callback/github`.

## Developer workflow

| Step | Implemented behavior | Source |
| --- | --- | --- |
| 1. Create | Validate a configured template; create/reconcile the repository; personalize files; set topics and secrets; register the fleet; persist the catalog record | [`services/create/route.ts`](apps/web/src/app/api/services/create/route.ts) |
| 2. Initialize CI | Write `.idp/repository-initialized` only after required setup succeeds, then poll the marker-triggered workflow | [`github.ts`](apps/web/src/lib/server/github.ts) |
| 3. Observe | Combine catalog metadata with configured provider snapshots | [`runtime-status.ts`](apps/web/src/lib/server/runtime-status.ts) |
| 4. Promote | Copy the source overlay image tag dev→stage or stage→prod on a branch and open a pull request | [`promotion-service.ts`](apps/web/src/lib/server/promotion-service.ts) |
| 5. Provision | Persist a request, generate a claim under the selected overlay, and open a `provision/...` pull request | [`infrastructure-provisioning.ts`](apps/web/src/lib/server/infrastructure-provisioning.ts) |
| 6. Roll back | Find the previous image tag in up to 30 overlay commits and open a rollback pull request | [`promotion-service.ts`](apps/web/src/lib/server/promotion-service.ts) |

For promotion, rollback, and infrastructure workflows, Nexus stops after opening a GitHub pull request. Any runtime change depends on later review, merge, and external reconciliation; Nexus does not apply those manifests directly.

### API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | [`/api/services`](apps/web/src/app/api/services/route.ts) | Catalog services |
| `POST` | [`/api/services/create`](apps/web/src/app/api/services/create/route.ts) | Golden-path workflow |
| `GET` | [`/api/services/create/workflow`](apps/web/src/app/api/services/create/workflow/route.ts) | Workflow-run status |
| `GET/POST` | [`/api/promotions`](apps/web/src/app/api/promotions/route.ts) | Release snapshot / promotion PR |
| `POST` | [`/api/rollbacks`](apps/web/src/app/api/rollbacks/route.ts) | Rollback PR |
| `POST` | [`/api/infrastructure/provision`](apps/web/src/app/api/infrastructure/provision/route.ts) | Crossplane claim PR |
| `GET/POST` | [`/api/auth/[...nextauth]`](apps/web/src/app/api/auth/%5B...nextauth%5D/route.ts) | Auth.js |

## Testing and validation

Commands are defined in the root and web workspace [package manifests](package.json).

| Command | Validates |
| --- | --- |
| `npm run lint` | ESLint across TypeScript/TSX source; currently emits the legacy-eslintrc deprecation warning |
| `npm run typecheck` | `tsc --noEmit` project consistency |
| `npm test` | Repository bootstrap and template-personalization contracts |
| `npm run build` | Next.js production compilation, route generation, and build-time checks |
| `npm exec -w apps/web -- prisma validate` | Prisma schema and datasource configuration |

The two current test files cover the initialization guard/marker and placeholder replacement, slugging, workflow image references, and unresolved-token detection: [`github-bootstrap.test.ts`](apps/web/src/lib/server/github-bootstrap.test.ts) and [`github-personalization.test.ts`](apps/web/src/lib/server/github-personalization.test.ts).

There are no browser E2E, API/database integration, live provider integration, or coverage-reporting commands.

## Deployment

For Vercel, use `apps/web` as the project root, `npm install` as the install command, and `npm run vercel-build` as the build command. Production builds generate Prisma Client, apply committed migrations, and build Next.js; preview builds skip migrations ([script](apps/web/scripts/vercel-build.sh)). Configure managed PostgreSQL with pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED`.

See [Vercel deployment](docs/vercel-deployment.md) and [Neon migrations](docs/neon-production-migrations.md).

## Security and limitations

### Authentication and authorization

- GitHub mode uses Auth.js state checks and JWT sessions; mock mode stores a demo identity in browser local storage ([auth](apps/web/src/lib/server/auth-options.ts), [mock session](apps/web/src/components/MockSessionContext.tsx)).
- GitHub identities map to predefined roles/teams. Organization membership, durable account lifecycle, invitation acceptance, and server-side session revocation are not implemented.
- The portal uses a [client-side gate](apps/web/src/components/AuthGate.tsx). Mutation routes do not enforce the session's role, team, environment, or tenant, and actor/requester values are not consistently derived from a trusted session.
- The [schema](apps/web/prisma/schema.prisma) has no top-level tenant model or tenant key on every record. Do not expose mutation APIs beyond a controlled environment without server-enforced RBAC and tenant scoping.

### Secrets and operational boundaries

- Provider credentials remain server-side. Docker Hub secrets are sealed with the repository's GitHub Actions public key before upload ([encryption](apps/web/src/lib/server/secret-encryption.ts)).
- One `GITHUB_TOKEN` performs repository, secret, fleet, release, and provisioning operations. Use the narrowest viable repository and permission scope.
- Argo CD and Kubernetes code performs reads; supply externally enforced read-only credentials ([runtime adapter](apps/web/src/lib/server/runtime-status.ts)).
- Unlike the pull-request-based release and infrastructure paths, [fleet registration](#platform-core-relationship) writes directly to `platform-core` `main`.
- Provider calls run in the web request lifecycle. There is no durable queue, webhook processor, distributed lock, or general dead-letter/retry mechanism.

### Not validated

The current tests do not validate authorization bypass resistance, tenant isolation, CSRF/rate limiting, live GitHub or cluster behavior, concurrent mutations, failure recovery, migration rollback, load, accessibility, dependency vulnerabilities, or penetration resistance. The repository also has no documented Content Security Policy, security response policy, or coverage threshold.

## Further documentation

- [Runtime integration contracts](docs/runtime-integrations.md)
- [Vercel deployment](docs/vercel-deployment.md)
- [Neon production migrations](docs/neon-production-migrations.md)
- [Architecture background](ARCHITECTURE.md)
- [Requirements](REQUIREMENTS.md)
