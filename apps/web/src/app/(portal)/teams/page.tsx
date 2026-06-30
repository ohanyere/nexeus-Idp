import { DataTable } from "@/components/DataTable";
import { InviteMemberButton } from "@/components/InviteMemberButton";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { teamProfiles } from "@/lib/auth";
import { getTeamResources, getTeamServices, teams } from "@/lib/mock-data";
import Link from "next/link";

export default function TeamsPage() {
 const serviceCount = teams.reduce((total, team) => total + getTeamServices(team.id).length, 0);
 const memberCount = teams.reduce((total, team) => total + team.members, 0);

 const rows = teams.map((team) => ({
 owner: teamProfiles.find((profile) => profile.id === team.id)?.owner ?? "Unassigned",
 team: (
 <Link href={`/teams/${team.id}`} className="font-semibold text-brand hover:text-slate-900">
 {team.name}
 </Link>
 ),
 members: team.members,
 services: getTeamServices(team.id).length,
 resources: getTeamResources(team.id).length,
 slack: teamProfiles.find((profile) => profile.id === team.id)?.slackChannel ?? "N/A",
 "github org": teamProfiles.find((profile) => profile.id === team.id)?.githubOrganization ?? "N/A",
 "cost center": teamProfiles.find((profile) => profile.id === team.id)?.costCenter ?? "N/A",
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
 action={<InviteMemberButton />}
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Teams" value={String(teams.length)} detail="Mock tenant groups" />
 <StatCard label="Members" value={String(memberCount)} detail="Mock people records" />
 <StatCard label="Owned services" value={String(serviceCount)} detail="Catalog ownership links" />
 </section>
 <DataTable columns={["team", "owner", "members", "services", "resources", "slack", "github org", "cost center", "ownership", "monthly cost", "deployments", "incidents", "violations"]} rows={rows} />
 </>
 );
}
