# Senior IDP Platform Architecture

## 1. Requirements Analysis

This platform is a production-grade Internal Developer Platform for platform engineering teams and application teams. Its primary job is to centralize the developer experience around service ownership, service creation, deployment operations, resource provisioning, operational visibility, governance, and reliability posture.

The platform must act as a control plane over existing engineering systems rather than replacing them. GitHub remains the source for repositories and templates, GitHub Actions remains a build signal source, ArgoCD and Argo Rollouts remain deployment execution systems, Kubernetes remains runtime infrastructure, Crossplane remains infrastructure provisioning machinery, Vault remains secret authority, Kyverno remains policy enforcement, and Prometheus/Grafana/Loki remain observability backends.

The IDP should store platform metadata, user intent, relationships, history, audit events, computed scorecards, and integration snapshots. External systems should remain the source of truth for their native runtime state where appropriate.

Core product capabilities:

- Multi-tenant organization and team management.
- Service catalog with ownership, lifecycle, environments, dependencies, documentation, scorecards, health, cost, and deployment visibility.
- Golden path service creation through approved templates and GitHub repository generation.
- Deployment management across dev, stage, and prod.
- Deployment history, logs, failure reason visibility, and rollback workflows.
- Resource marketplace backed by Crossplane-style claims.
- Governance visibility through policy results, audit logs, scorecards, and drift detection.
- Platform health, topology visualization, disaster recovery visibility, cost visibility, API documentation, event documentation, and activity feeds.

Non-goals for the initial architecture:

- The IDP should not own Kubernetes reconciliation loops.
- The IDP should not become the canonical log store.
- The IDP should not duplicate all GitHub, ArgoCD, or Kubernetes state indefinitely.
- The IDP should not bypass GitOps controls for production changes.

## 2. Platform Architecture Summary

The platform should be structured as a modular monolith for Phase 1, with clear domain boundaries that can be split into services later if load, ownership, or compliance needs justify it.

Recommended high-level architecture:

- Web application: React/TypeScript frontend for platform users.
- Backend API: TypeScript or Go service exposing REST or GraphQL APIs to the frontend.
- Worker service: asynchronous jobs for integration sync, repository generation workflows, deployment polling, drift scans, scorecard recalculation, and activity feed fanout.
- Database: PostgreSQL for platform metadata, relationships, audit trails, workflow state, and cached integration state.
- Cache/queue: Redis or managed queue for background jobs, rate limiting, short-lived integration state, and event fanout.
- Object storage: optional storage for generated artifacts, imported specs, large logs excerpts, topology snapshots, or report exports.
- Integration adapters: isolated modules for GitHub, GitHub Actions, Docker Hub, ArgoCD, Kubernetes, Crossplane, Vault, Kyverno, Argo Rollouts, Istio, Prometheus, Grafana, and Loki.

Core design principles:

- Tenant isolation is explicit in every persisted domain model.
- External integration calls flow through adapter interfaces.
- User-initiated operational actions create durable workflow records.
- Audit events are immutable.
- Deployment actions prefer GitOps-compatible changes and record external system references.
- Runtime state is synchronized into query-friendly snapshots with timestamps and source metadata.
- The service catalog is the organizing center for most platform features.

## 3. Core Domain Entities

Tenant and identity:

- Tenant: top-level customer, organization, or business unit boundary.
- User: authenticated human or service account identity.
- Team: ownership group inside a tenant.
- Role: named permission bundle.
- Membership: relationship between users, teams, and roles.
- Permission: action-level capability used by authorization checks.

Catalog:

- Service: catalog entry for an application, API, worker, library, or platform component.
- Component: sub-unit of a service when a service contains multiple deployable or documented parts.
- Ownership: service-to-team relationship with ownership type.
- Repository: linked GitHub repository metadata.
- ServiceEnvironment: service-specific environment configuration for dev, stage, and prod.
- Dependency: relationship between services, resources, APIs, events, or external systems.
- DocumentationLink: catalog link to docs, runbooks, dashboards, APIs, events, and operational resources.

Golden paths and repository generation:

- Template: approved golden path definition.
- TemplateVersion: immutable version of a template.
- TemplateParameter: parameter schema exposed to users.
- RepositoryGenerationRequest: user request to create a repository from a template.
- RepositoryGenerationRun: execution state for GitHub repository creation and post-create setup.

Deployments:

- Deployment: desired or observed deployment event for a service environment.
- DeploymentVersion: deployable version identified by commit SHA, image tag, artifact, and source repository.
- DeploymentRun: execution attempt for a deployment action.
- RollbackRequest: user intent to roll back to a previous stable version.
- RolloutStatus: Argo Rollouts canary or progressive delivery state.
- DeploymentLogReference: pointers to GitHub Actions, ArgoCD, Kubernetes, rollout, Loki, and Kyverno logs/events.

Resources:

- ResourceOffering: marketplace item such as database, queue, bucket, cache, or secret path.
- ResourceClaim: tenant/team/service request for provisioned infrastructure.
- ResourceInstance: observed provisioned resource.
- ResourceBinding: relationship between a service and a resource instance.

Operations and visibility:

- Environment: platform-wide environment definition such as dev, stage, and prod.
- HealthSignal: normalized health data from Kubernetes, ArgoCD, Prometheus, or synthetic checks.
- CostRecord: cost allocation record by tenant, team, service, environment, resource, or time range.
- TopologyNode: service, resource, workload, API, event, or external dependency in the topology graph.
- TopologyEdge: relationship between topology nodes.
- ApiDocument: OpenAPI, GraphQL, gRPC, or other API documentation metadata.
- EventDocument: AsyncAPI or event contract metadata.
- Policy: governance policy metadata from Kyverno or platform rules.
- PolicyResult: policy evaluation or rejection result.
- Scorecard: definition of maturity, reliability, security, or ownership checks.
- ScorecardResult: computed score for a service or team.
- DriftFinding: detected difference between desired and observed GitOps/runtime state.
- DisasterRecoveryProfile: RTO/RPO, backup, restore, replica, and readiness metadata.
- DisasterRecoveryCheck: observed DR readiness result.
- ActivityEvent: user-facing feed event.
- AuditLogEntry: immutable security and compliance event.

## 4. Entity Relationships

Tenant relationships:

- A tenant has many users, teams, services, templates, resource offerings, policies, scorecards, and audit log entries.
- A user can belong to many teams through memberships.
- A team can own many services and resource claims.
- Roles can be assigned to users or memberships depending on the authorization model.

Catalog relationships:

- A service belongs to one tenant.
- A service has one primary owning team and may have secondary owning teams.
- A service can link to one or more repositories.
- A service has many service environments.
- A service can depend on many services, resources, APIs, events, or external systems.
- A service has many documentation links, API documents, event documents, scorecard results, health signals, deployments, and activity events.

Golden path relationships:

- A template belongs to a tenant or is globally shared.
- A template has many immutable template versions.
- A repository generation request uses exactly one template version.
- A repository generation run creates or updates one repository link.
- A successful repository generation request can create an initial service catalog entry.

Deployment relationships:

- A deployment belongs to one service environment.
- A deployment points to one deployment version.
- A deployment can have many deployment runs.
- A deployment run can reference GitHub Actions runs, ArgoCD application syncs, Kubernetes workloads, Loki log queries, Kyverno policy results, and Argo Rollouts objects.
- A rollback request targets a previous deployment version and creates a new deployment run.
- Deployment actions create audit log entries and activity events.

Resource relationships:

- A resource offering can produce many resource claims.
- A resource claim belongs to a tenant, requesting team, optional service, and environment.
- A resource claim can resolve to one or more resource instances.
- A resource instance can be bound to one or more services.
- Resource health, cost, drift, and policy results can attach to resource instances.

Governance and visibility relationships:

- Policies can apply at tenant, team, service, environment, resource, or cluster scope.
- Policy results can attach to deployments, resources, services, or clusters.
- Scorecards have many checks and many scorecard results.
- Drift findings attach to services, environments, repositories, ArgoCD applications, Kubernetes resources, or resource claims.
- Disaster recovery profiles attach to services and critical resources.
- Activity events are user-facing and may reference any domain object.
- Audit log entries are immutable and record actor, action, target, tenant, timestamp, result, and metadata.

## 5. Complete Repository Structure

Recommended repository layout:

```text
senior-idp-platform/
  README.md
  REQUIREMENTS.md
  ARCHITECTURE.md
  BUILD_PHASES.md
  docs/
    decisions/
    diagrams/
    api/
    operations/
    security/
  apps/
    web/
      src/
      public/
      tests/
    api/
      src/
      tests/
    worker/
      src/
      tests/
  packages/
    config/
    contracts/
    domain/
    integrations/
    observability/
    policy/
    ui/
    validation/
  infra/
    docker/
    kubernetes/
    helm/
    terraform/
    local-dev/
  database/
    schema/
    migrations/
    seeds/
  scripts/
    dev/
    ci/
    release/
  .github/
    workflows/
```

Directory responsibilities:

- `apps/web`: frontend application.
- `apps/api`: backend API service.
- `apps/worker`: asynchronous job runner and integration sync processor.
- `packages/contracts`: shared API types, event contracts, and schema definitions.
- `packages/domain`: shared domain model definitions and domain constants.
- `packages/integrations`: external system adapter interfaces and client wrappers.
- `packages/policy`: platform governance and scorecard rule definitions.
- `packages/observability`: logging, tracing, metrics, and health utilities.
- `packages/ui`: shared design system components when frontend implementation begins.
- `database`: schema ownership, migrations, seed data, and local fixtures.
- `infra`: local and deployable platform infrastructure definitions.
- `docs`: architectural decisions, operational docs, diagrams, security model, and API specifications.

## 6. Frontend Application Structure

Recommended frontend structure:

```text
apps/web/src/
  app/
    routes/
    providers/
    layout/
  features/
    activity/
    audit/
    catalog/
    costs/
    deployments/
    docs/
    drift/
    environments/
    golden-paths/
    governance/
    health/
    marketplace/
    platform-admin/
    scorecards/
    teams/
    topology/
  shared/
    api/
    auth/
    components/
    hooks/
    icons/
    state/
    styles/
    telemetry/
    utils/
  test/
```

Frontend product areas:

- Home: tenant-aware operational landing view with health, activity, ownership, and deployment highlights.
- Teams: teams, members, roles, ownership, and service responsibility.
- Catalog: service search, service profile, dependencies, documentation, scorecards, costs, health, deployments, and topology.
- Golden Paths: template browser, parameter input, request tracking, and repository generation status.
- Deployments: environment-aware deployment status, history, logs, rollout status, failure explanations, and rollback confirmation.
- Marketplace: resource offerings, claim requests, claim status, resource binding, and provisioned resource details.
- Governance: policies, policy results, exceptions, scorecards, drift, and audit trail.
- Operations: platform health, disaster recovery readiness, observability links, and integration status.
- Admin: tenant settings, integrations, environments, roles, and platform configuration.

Frontend boundary rules:

- Pages compose feature modules; feature modules own their domain-specific screens and state.
- Shared modules only contain reusable primitives and cross-cutting utilities.
- API access is centralized in typed clients.
- Authorization-aware navigation and actions are driven by backend-provided capabilities.
- Runtime state should show source, freshness, and last sync time where relevant.

## 7. Backend Application Structure

Recommended backend structure:

```text
apps/api/src/
  main/
    server
    config
    dependency-injection
  modules/
    activity/
    audit/
    auth/
    catalog/
    costs/
    deployments/
    docs/
    drift/
    environments/
    golden-paths/
    governance/
    health/
    integrations/
    marketplace/
    scorecards/
    teams/
    topology/
  shared/
    database/
    events/
    errors/
    logging/
    pagination/
    permissions/
    validation/

apps/worker/src/
  jobs/
    github-sync/
    repository-generation/
    deployment-sync/
    argocd-sync/
    kubernetes-sync/
    cost-import/
    drift-detection/
    scorecard-compute/
    health-rollup/
    activity-fanout/
  shared/
    queue/
    scheduling/
    retry/
    integrations/
```

Backend domain boundaries:

- Auth and tenancy: authentication context, tenant resolution, role checks, permissions, and service accounts.
- Teams: teams, memberships, roles, and ownership assignments.
- Catalog: services, repositories, dependencies, environments, documentation links, API docs, and event docs.
- Golden paths: templates, versions, parameter schemas, repository generation workflows, and service bootstrap records.
- Deployments: deployment actions, deployment history, rollback requests, logs, status aggregation, and external deployment references.
- Marketplace: resource offerings, claims, instances, bindings, and Crossplane integration.
- Governance: policies, scorecards, policy results, audit logs, and exceptions.
- Operations: health, costs, topology, drift, DR readiness, and activity feeds.
- Integrations: external adapter registry, credentials, webhook handling, sync state, and rate limiting.

Backend operational rules:

- All mutation endpoints must be tenant-scoped and permission-checked.
- All operational actions must produce audit logs.
- Long-running workflows must create durable workflow records and execute asynchronously.
- External system failures should be visible to users and retried with bounded backoff.
- Integration sync state should include source system, cursor, status, last success, last failure, and freshness.

## 8. High-Level Database Schema

Recommended PostgreSQL schema groups:

Tenant and identity:

- `tenants`
- `users`
- `teams`
- `team_memberships`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

Catalog:

- `services`
- `service_owners`
- `repositories`
- `service_repositories`
- `environments`
- `service_environments`
- `dependencies`
- `documentation_links`
- `api_documents`
- `event_documents`

Golden paths:

- `templates`
- `template_versions`
- `template_parameters`
- `repository_generation_requests`
- `repository_generation_runs`

Deployments:

- `deployment_versions`
- `deployments`
- `deployment_runs`
- `rollback_requests`
- `rollout_statuses`
- `deployment_log_references`
- `external_run_references`

Marketplace and resources:

- `resource_offerings`
- `resource_claims`
- `resource_instances`
- `resource_bindings`
- `resource_statuses`

Governance:

- `policies`
- `policy_results`
- `scorecards`
- `scorecard_checks`
- `scorecard_results`
- `audit_log_entries`

Operations:

- `health_signals`
- `cost_records`
- `topology_nodes`
- `topology_edges`
- `drift_findings`
- `disaster_recovery_profiles`
- `disaster_recovery_checks`
- `activity_events`
- `integration_connections`
- `integration_sync_states`
- `webhook_events`
- `workflow_runs`

Schema conventions:

- Every tenant-owned table includes `tenant_id`.
- Every mutable table includes `created_at`, `updated_at`, and where useful `deleted_at`.
- Every externally sourced record includes `source_system`, `external_id`, `synced_at`, and `raw_snapshot` where useful.
- Audit log entries are append-only.
- Activity events are append-only but can have read-state tables later.
- Use stable internal IDs and avoid exposing external IDs as primary identifiers.
- Use explicit environment identifiers instead of free-form environment strings.

## 9. API Boundaries

The API should expose product-oriented boundaries rather than leaking integration-specific APIs directly.

Recommended API domains:

- `/auth`: current user, session, capabilities, and tenant context.
- `/tenants`: tenant settings and integration configuration.
- `/teams`: teams, memberships, roles, and ownership.
- `/catalog`: services, repositories, dependencies, docs, APIs, events, environments, and topology entry points.
- `/templates`: golden path templates, versions, parameters, and repository generation requests.
- `/deployments`: deployment status, history, logs, rollout state, trigger deployment, and rollback.
- `/marketplace`: resource offerings, claims, instances, and bindings.
- `/governance`: policies, policy results, scorecards, exceptions, and audit logs.
- `/health`: platform health, service health, integration health, and environment health.
- `/costs`: cost summaries by tenant, team, service, resource, and environment.
- `/topology`: graph views and relationship queries.
- `/drift`: drift findings, scan status, and remediation references.
- `/dr`: disaster recovery profiles and readiness checks.
- `/activity`: activity feed queries.
- `/integrations`: integration connection status, webhook ingestion, and sync controls.

Mutation boundaries:

- Creating a service through a golden path starts a repository generation workflow.
- Triggering a deployment starts a deployment workflow.
- Rolling back starts a rollback workflow.
- Creating a resource claim starts a provisioning workflow.
- Updating policy exceptions or ownership changes creates audit logs.

Read boundaries:

- Catalog reads return platform-owned metadata plus fresh-enough integration snapshots.
- Deployment reads aggregate GitHub Actions, ArgoCD, Kubernetes, Argo Rollouts, Loki, and Kyverno references into one user-facing model.
- Logs endpoints should return excerpts or query references, not permanently duplicate full log streams.
- Topology endpoints should support scoped graph queries by tenant, team, service, environment, and dependency type.

Event boundaries:

- Webhook ingestion should normalize GitHub, GitHub Actions, ArgoCD, Kubernetes, and policy events into internal events.
- Internal events should update snapshots, emit activity events, and create audit entries when user intent or privileged action is involved.
- Background sync should repair missed webhooks and maintain eventual consistency.
