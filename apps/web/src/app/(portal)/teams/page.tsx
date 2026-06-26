import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { getTeamResources, getTeamServices, teams } from "@/lib/mock-data";
import Link from "next/link";

export default function TeamsPage() {
 const serviceCount = teams.reduce((total, team) => total + getTeamServices(team.id).length, 0);
 const memberCount = teams.reduce((total, team) => total + team.members, 0);

 const rows = teams.map((team) => ({
 team: (
 <Link href={`/teams/${team.id}`} className="font-semibold text-brand hover:text-slate-900">
 {team.name}
 </Link>
 ),
 members: team.members,
 services: getTeamServices(team.id).length,
 resources: getTeamResources(team.id).length,
 ownership: team.ownership,
 "monthly cost": team.monthlyCost,
 deployments: team.deploymentsThisMonth,
 incidents: team.incidentsThisMonth,
 violations: team.policyViolations
 }));

 return (
 <>
 <PageHeader
 title="Teams"
 description="Manage team ownership boundaries, membership shape, service responsibility, and mock operational posture."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Teams" value={String(teams.length)} detail="Mock tenant groups" />
 <StatCard label="Members" value={String(memberCount)} detail="Mock people records" />
 <StatCard label="Owned services" value={String(serviceCount)} detail="Catalog ownership links" />
 </section>
 <DataTable columns={["team", "members", "services", "resources", "ownership", "monthly cost", "deployments", "incidents", "violations"]} rows={rows} />
 </>
 );
}
