# Runtime Integrations

Runtime pages should try live integrations first and then show honest empty or warning states. They must not invent successful runtime state when credentials are missing or a backend returns no objects.

## Sources And Badges

Runtime views use source badges for:

- `GitHub`
- `ArgoCD`
- `Cluster`
- `Crossplane`
- `Kyverno`
- `Seed`
- `Demo`

`Seed` and `Demo` are allowed for catalog/demo surfaces, but operational runtime success should come from a live integration source.

## GitHub

Used for:

- Repository metadata
- Latest commit
- Latest workflow run
- Container image inference from a real repository commit
- Service creation and template personalization
- Release snapshots, promotion PRs, and rollback PRs

Required variables:

```bash
GITHUB_TOKEN=
GITHUB_ORG=
GITHUB_TEMPLATE_OWNER=
GITHUB_TEMPLATE_REPO_GO_API=
GITHUB_TEMPLATE_REPO_NODE_API=
GITHUB_TEMPLATE_REPO_PYTHON_API=
GITHUB_TEMPLATE_REPO_NEXTJS_FRONTEND=
GITHUB_TEMPLATE_REPO_WORKER_SERVICE=
```

The token needs access to read generated service repositories, create repositories from templates, write contents/secrets/topics for generated repositories, and create promotion or rollback pull requests.

If `GITHUB_TOKEN` or repository metadata is missing, runtime status shows GitHub signals as unavailable. Catalog-derived image values may appear with a `Seed` source, not as live GitHub success.

## ArgoCD

Used for:

- Application existence
- Sync status
- Health status
- Revision and last sync
- Provisioning overlay status for GitOps-backed claims

Required variables:

```bash
ARGOCD_BASE_URL=
ARGOCD_TOKEN=
```

`ARGOCD_BASE_URL` should be the reachable ArgoCD API URL, without a trailing slash. `ARGOCD_TOKEN` should be a token with read access to Applications.

Expected application names are:

```text
<serviceId>-<environment>
<repositoryName>-<environment>
```

If ArgoCD is missing, the UI shows `Integration not configured` or unavailable ArgoCD signals. If ArgoCD is reachable but no Application exists, the UI shows `No ArgoCD application found` or an equivalent warning.

## Kubernetes Cluster

Used for:

- Pods
- Services
- HPAs
- PodDisruptionBudgets
- NetworkPolicies
- Kubernetes Events
- Argo Rollouts custom resources

Required variables:

```bash
KUBERNETES_API_URL=
KUBERNETES_BEARER_TOKEN=
```

The token needs read permissions for each service namespace:

```text
<serviceId>-dev
<serviceId>-stage
<serviceId>-prod
```

Minimum read scope:

- core API: pods, services, events
- `autoscaling/v2`: horizontalpodautoscalers
- `policy/v1`: poddisruptionbudgets
- `networking.k8s.io/v1`: networkpolicies
- `argoproj.io/v1alpha1`: rollouts

If Kubernetes credentials are missing, the resource explorer returns an empty `Cluster` inventory with a warning. If credentials work but no objects exist, the UI shows `No runtime resources found`.

## Crossplane

Used for:

- GitOps-backed infrastructure claim readiness
- Claim conditions
- Provisioning status on provision request and provisioned resource pages

Crossplane reads use the Kubernetes API credentials:

```bash
KUBERNETES_API_URL=
KUBERNETES_BEARER_TOKEN=
```

The adapter reads claim objects under:

```text
/apis/platform.ohanyere.com/v1alpha1/namespaces/<namespace>/<claimPlural>/<claimName>
```

Known claim kind plurals:

- `PostgreSQLInstance` -> `postgresqlinstances`
- `RedisInstance` -> `redisinstances`
- `ObjectBucket` -> `objectbuckets`
- `MessageQueue` -> `messagequeues`
- `DynamoDBTable` -> `dynamodbtables`

If Kubernetes credentials are missing, Crossplane status shows `Integration not configured`. If credentials work but the claim cannot be read, the UI shows `No Crossplane claims found`.

## Kyverno

Used for:

- Service-level PolicyReport counts
- Governance summary
- Policy violation rows derived from fail, warn, or error results

Kyverno reads use the Kubernetes API credentials:

```bash
KUBERNETES_API_URL=
KUBERNETES_BEARER_TOKEN=
```

The adapter reads:

```text
/apis/wgpolicyk8s.io/v1alpha2/policyreports
/apis/wgpolicyk8s.io/v1alpha2/namespaces/<namespace>/policyreports
```

The Kubernetes token needs read access to PolicyReports in service namespaces and, for governance summary pages, cluster-wide list access if available.

If credentials are missing, governance shows `Integration not configured`. If credentials work but no PolicyReports exist, governance shows `No PolicyReports found`.

## Failure Contract

Runtime adapters follow this contract:

- Missing env vars: return unavailable signals, warnings, or `Integration not configured`.
- Integration reachable with no data: return an empty state.
- Integration error: return a warning with the provider/source.
- Demo or seed data must not be rendered as live runtime success.

This keeps demo and catalog data available while making operational state honest.
