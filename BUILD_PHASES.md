# Senior IDP Platform Build Phases

## Build Strategy

Build the platform from the inside out: establish tenancy, identity, catalog, and audit foundations first, then layer workflows and integrations on top. The service catalog should become the center of gravity before deployment management, marketplace provisioning, scorecards, topology, or cost visibility are expanded.

Phase 1 should produce a usable platform foundation, not a demo shell. It should include enough vertical behavior to validate the architecture: teams can own services, services can connect to repositories, templates can create repository generation requests, deployments can be represented per environment, and audit/activity records can explain what happened.

## Phase 1 Goal

Create the minimum production-grade foundation for the IDP:

- Multi-tenant data model.
- User, team, membership, and ownership model.
- Service catalog core.
- Environment model for dev, stage, and prod.
- Repository metadata model.
- Golden path template metadata and repository generation workflow records.
- Deployment history model.
- Rollback request model.
- Audit log and activity feed foundations.
- Integration connection registry.
- Backend and frontend module boundaries.
- Local development and CI foundations.

Phase 1 should avoid deep integrations until the platform has stable internal contracts. External integrations can begin as adapter interfaces with mocked or manually seeded snapshots, then graduate to real GitHub and ArgoCD flows once the core model is stable.

## Phase 1 Build Order

### 1. Repository and Tooling Foundation

Deliverables:

- Monorepo structure for `apps/web`, `apps/api`, `apps/worker`, `packages`, `database`, `infra`, and `docs`.
- Shared formatting, linting, type checking, and test commands.
- Local development environment definition.
- CI workflow skeleton for validation.
- Environment variable and configuration conventions.

Acceptance criteria:

- Developers can install dependencies and run validation commands consistently.
- The repo layout matches the architecture boundaries.
- No feature code depends on undeclared cross-package imports.

### 2. Architectural Contracts

Deliverables:

- Domain contracts for tenants, users, teams, services, environments, repositories, templates, deployments, audit entries, and activity events.
- API contract conventions for pagination, filtering, sorting, errors, authorization, and timestamps.
- Integration adapter interface conventions.
- Workflow state machine conventions for long-running jobs.

Acceptance criteria:

- Frontend, backend, and worker can share stable contract definitions.
- Every domain object has a clear tenant boundary.
- Long-running operations have explicit states such as queued, running, succeeded, failed, cancelled, and retrying.

### 3. Tenancy, Identity, and Authorization Foundation

Deliverables:

- Tenant model.
- User model.
- Team model.
- Team membership model.
- Role and permission model.
- Current-user and capability API boundary.
- Authorization guard conventions.

Acceptance criteria:

- Every request resolves tenant context.
- Users can be associated with teams.
- Backend mutations can enforce permission checks.
- Frontend navigation can be driven by backend-provided capabilities.

### 4. Audit Log Foundation

Deliverables:

- Append-only audit log model.
- Audit writer interface.
- Audit query boundary.
- Standard audit event fields: tenant, actor, action, target type, target ID, result, timestamp, request ID, and metadata.

Acceptance criteria:

- Sensitive and operational mutations can record audit events.
- Audit entries are immutable from normal application flows.
- Audit queries can filter by tenant, actor, action, target, and time range.

### 5. Service Catalog Core

Deliverables:

- Service model.
- Service ownership model.
- Repository link model.
- Environment model.
- Service environment model.
- Documentation link model.
- Catalog search and list boundary.
- Service detail boundary.

Acceptance criteria:

- A tenant can list services.
- A service can have an owning team.
- A service can link to one or more repositories.
- A service can declare dev, stage, and prod environment records.
- Catalog records can be extended later with health, scorecards, costs, topology, APIs, events, and deployments.

### 6. Activity Feed Foundation

Deliverables:

- Activity event model.
- Activity writer interface.
- Feed query boundary.
- Event target references for services, teams, templates, deployments, resources, and policies.

Acceptance criteria:

- Catalog, ownership, template, deployment, and rollback actions can emit activity events.
- Users can query tenant-wide and service-specific activity.
- Events are append-only and preserve actor, target, verb, timestamp, and summary metadata.

### 7. Integration Registry Foundation

Deliverables:

- Integration connection model.
- Integration sync state model.
- External reference model for GitHub, GitHub Actions, ArgoCD, Kubernetes, Crossplane, Vault, Kyverno, Argo Rollouts, Istio, Prometheus, Grafana, Loki, and Docker Hub.
- Adapter interface definitions.
- Webhook event storage boundary.

Acceptance criteria:

- The platform can record which integrations are configured per tenant.
- Sync state can represent last success, last failure, cursor, source, and freshness.
- External IDs are captured without becoming platform primary keys.

### 8. Golden Path Template Foundation

Deliverables:

- Template model.
- Template version model.
- Template parameter schema model.
- Repository generation request model.
- Repository generation run model.
- Worker job contract for repository generation.

Acceptance criteria:

- A user can view available templates.
- A repository generation request can be created against a template version.
- The request records selected parameters, requester, tenant, team, target repository name, status, and failure details.
- The workflow can later call GitHub template APIs without changing the user-facing contract.

### 9. Deployment Model Foundation

Deliverables:

- Deployment version model.
- Deployment model scoped to service environment.
- Deployment run model.
- Rollout status snapshot model.
- Deployment log reference model.
- External run reference model.

Acceptance criteria:

- A service environment can show current and previous deployment versions.
- Deployment records include commit SHA, image tag, environment, deployed by, deployment time, status, health status, and source references.
- The model can reference GitHub Actions, ArgoCD, Kubernetes, Argo Rollouts, Loki, and Kyverno without embedding integration-specific details in the core entity.

### 10. Rollback Workflow Foundation

Deliverables:

- Rollback request model.
- Rollback confirmation API boundary.
- Rollback workflow state machine.
- Audit and activity integration for rollback actions.

Acceptance criteria:

- A user can select a previous stable deployment version as a rollback target.
- The rollback request stores service, environment, target version, image tag, commit SHA, requester, reason, status, and workflow references.
- The rollback workflow can later trigger GitOps, ArgoCD, or Argo Rollouts without changing the stored intent model.
- Confirmed rollback attempts create audit log entries.

### 11. Frontend Shell and Information Architecture

Deliverables:

- App routing structure.
- Tenant-aware layout.
- Navigation groups for Catalog, Teams, Golden Paths, Deployments, Marketplace, Governance, Operations, Activity, and Admin.
- Typed API client convention.
- Permission-aware navigation convention.

Acceptance criteria:

- The frontend structure supports the platform modules without creating feature coupling.
- Screens can be added feature by feature.
- No React components need to be implemented during architecture planning.

### 12. Backend Module Skeleton

Deliverables:

- API module boundaries for auth, teams, catalog, templates, deployments, audit, activity, integrations, and environments.
- Worker module boundaries for repository generation, deployment sync, integration sync, scorecard compute, and drift detection.
- Shared database, validation, errors, logging, pagination, permissions, and event utilities.

Acceptance criteria:

- Each module has clear ownership.
- Cross-module interactions happen through service interfaces or internal events.
- Background jobs can be added without changing API request contracts.

### 13. Database Design Finalization

Deliverables:

- High-level schema reviewed against domain model.
- Tenant scoping rules.
- Indexing strategy for common queries.
- Migration naming and review conventions.
- Seed data plan for local development.

Acceptance criteria:

- Core query paths are known before migrations are written.
- Audit and activity tables are designed as append-only.
- External snapshots and workflow records have retention expectations.
- No database migrations are created during architecture planning.

### 14. Phase 1 Vertical Slice Readiness Review

Deliverables:

- Architecture review checklist.
- Security and permission review.
- Integration readiness review.
- Observability and audit readiness review.
- Phase 2 backlog candidates.

Acceptance criteria:

- The team can implement Phase 1 without revisiting core entity boundaries.
- Risks and deferred decisions are documented.
- Phase 2 scope is separated from Phase 1 foundation work.

## Recommended Phase 1 Implementation Sequence

The practical implementation order should be:

1. Repository/tooling foundation.
2. Shared contracts and domain types.
3. Database schema design review.
4. Tenancy, users, teams, roles, and permissions.
5. Audit log.
6. Service catalog core.
7. Activity feed.
8. Integration registry.
9. Golden path template metadata and repository generation workflow records.
10. Deployment history and environment-aware deployment model.
11. Rollback request workflow model.
12. Frontend shell and feature routing.
13. Backend module skeleton and API boundaries.
14. Local seed data and validation plan.
15. Phase 1 readiness review.

## Phase 2 Candidates

Phase 2 should add real integration behavior and operational depth:

- GitHub repository generation through GitHub templates.
- GitHub Actions build run ingestion.
- ArgoCD application sync status.
- Kubernetes workload status.
- Argo Rollouts canary status.
- Loki log query integration.
- Kyverno policy result ingestion.
- Crossplane resource claim creation.
- Initial service health rollups.
- Initial platform health view.
- Initial scorecard computation.
- Initial drift detection.

## Phase 3 Candidates

Phase 3 should deepen platform intelligence:

- Topology graph visualization.
- Cost visibility and allocation.
- API documentation ingestion.
- Event documentation ingestion.
- Disaster recovery readiness tracking.
- Governance exceptions and approval workflows.
- Advanced scorecards.
- Deployment failure explanation aggregation.
- Production rollback execution through GitOps-compatible workflows.

## Phase 4 Candidates

Phase 4 should harden for enterprise production:

- Advanced multi-tenant isolation controls.
- Fine-grained RBAC and delegated administration.
- SSO and SCIM integration.
- Webhook replay and reconciliation tooling.
- Integration rate-limit management.
- Data retention policies.
- Audit export.
- Compliance reporting.
- HA deployment architecture.
- Backup and restore runbooks.
- Load testing and performance budgets.

## Phase 1 Risks and Decisions to Resolve

Key decisions:

- Backend language and framework.
- Frontend framework and routing approach.
- API style: REST, GraphQL, or hybrid.
- Database migration tool.
- Queue and worker technology.
- Authentication provider.
- Authorization model granularity.
- Local development stack.
- Initial supported integration depth for GitHub and ArgoCD.

Key risks:

- Too much direct coupling to external integration schemas.
- Treating runtime snapshots as canonical state.
- Under-designing tenant isolation.
- Adding deployment execution before audit, authorization, and workflow state are stable.
- Building UI screens before the domain model settles.
- Attempting full marketplace, topology, scorecards, and cost visibility in Phase 1.
