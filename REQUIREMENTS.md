A production-grade Internal Developer Platform for platform engineering teams.

The platform allows engineering teams to:
- create services from golden path templates
- manage teams and service ownership
- view service catalog
- track deployments across dev/stage/prod
- provision resources through Crossplane-style claims
- view topology, costs, policies, scorecards, and platform health
- detect GitOps drift
- track disaster recovery readiness

## Deployment Operations

The IDP must allow teams to manage deployments from inside the platform.

Each service should have a Deployments page showing:

- Current deployed version
- Previous deployed versions
- Deployment status
- Environment: dev, stage, prod
- Git commit SHA
- Docker image tag
- Deployment time
- Deployed by
- Rollout status
- Health status
- Associated logs

The platform should support:

- Triggering a deployment from the IDP
- Viewing deployment logs
- Viewing pod/application logs
- Viewing rollout history
- Rolling back to a previous stable version
- Showing failed deployments
- Showing why a deployment failed
- Showing ArgoCD sync status
- Showing Argo Rollouts canary status

Rollback behavior:

- A user selects a previous version
- The platform shows the version, image tag, commit SHA, and environment
- The user confirms rollback
- The backend triggers rollback through GitOps/ArgoCD or Argo Rollouts
- The platform records the rollback action in the audit log
- The deployment page updates with the new active version

Deployment logs should include:

- GitHub Actions build logs
- ArgoCD sync logs/events
- Kubernetes pod logs
- Rollout events
- Policy rejection messages from Kyverno