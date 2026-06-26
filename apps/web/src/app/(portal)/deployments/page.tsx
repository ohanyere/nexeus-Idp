import { DataTable } from "@/components/DataTable";
import { DeployNewVersionButton, RollbackButton, ViewLogsButton } from "@/components/DeploymentActions";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { deploymentOperationsStats, deployments } from "@/lib/mock-data";
import Link from "next/link";

export default function DeploymentsPage() {
 const rows = deployments.map((deployment) => ({
 service: (
 <Link href={`/deployments/${deployment.id}`} className="font-semibold text-brand hover:text-slate-900">
 {deployment.service}
 </Link>
 ),
 environment: deployment.environment,
 version: deployment.version,
 status: <StatusBadge label={deployment.status} tone={deployment.tone} />,
 "commit SHA": deployment.commit,
 "Docker Hub image tag": deployment.image,
 "deployed by": deployment.deployedBy,
 "deployed at": deployment.deployedAt,
 type: deployment.deploymentType,
 "rollout strategy": deployment.rolloutStrategy,
 rollback: <RollbackButton deployment={deployment} compact />,
 logs: <ViewLogsButton deploymentId={deployment.id} />
 }));

 return (
 <>
 <PageHeader
 title="Deployment operations"
 description="Operate deployment history, rollout visibility, logs, and rollback requests with mock-only workflows."
 action={<DeployNewVersionButton />}
 />
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
 {deploymentOperationsStats.map((stat) => (
 <StatCard key={stat.label} {...stat} />
 ))}
 </section>
 <DataTable
 columns={[
 "service",
 "environment",
 "version",
 "status",
 "commit SHA",
 "Docker Hub image tag",
 "deployed by",
 "deployed at",
 "type",
 "rollout strategy",
 "rollback",
 "logs"
 ]}
 rows={rows}
 />
 </>
 );
}
