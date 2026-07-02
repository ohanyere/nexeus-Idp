"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { mockUsers } from "@/lib/auth";
import { accessControlUsers, mockRoles, mockTenantTeams, rbacPermissions, rolePermissions } from "@/lib/mock-data";
import type { MockRole, Permission } from "@/lib/mock-data";

export default function AccessControlPage() {
 const { selectedRole, setSelectedRole, selectedTeam } = useMockSession();

 const userRows = accessControlUsers.map((user) => ({
 user: user.name,
 email: user.email,
 role: user.role,
 team: user.team
 }));

 const roleRows = mockRoles.map((role) => ({
 role,
 permissions: rolePermissions[role].length,
 "current session": role === selectedRole ? <StatusBadge label="Selected" tone="success" /> : ""
 }));

 const teamRows = mockTenantTeams.map((team) => ({
 team: team.name,
 tenant: team.tenant,
 scope: team.scope,
 selected: team.id === selectedTeam.id ? <StatusBadge label="Current" tone="success" /> : ""
 }));

 const permissionRows = rbacPermissions.map((permission) => ({
 permission,
 "Platform Admin": permissionCell("Platform Admin", permission),
 "Platform Engineer": permissionCell("Platform Engineer", permission),
 "Team Lead": permissionCell("Team Lead", permission),
 Developer: permissionCell("Developer", permission),
 Viewer: permissionCell("Viewer", permission)
 }));

 return (
 <>
 <PageHeader
 title="Access control"
 description="RBAC model for tenant/team scoped roles and visual permission behavior. GitHub identities map to these records until durable user administration is added."
 />

 <section className="grid gap-4 md:grid-cols-4">
 <StatCard label="Users" value={String(mockUsers.length)} detail="Mapped identities" />
 <StatCard label="Roles" value={String(mockRoles.length)} detail="Admin, Engineer, Lead, Developer, Viewer" />
 <StatCard label="Permissions" value={String(rbacPermissions.length)} detail="Action grants" />
 <StatCard label="Current role" value={selectedRole} detail={selectedTeam.name} />
 </section>

 <section className="console-panel rounded-md p-5">
 <label className="grid max-w-xs gap-2 text-sm font-medium text-slate-800">
 Preview role-aware UI as
 <select
 value={selectedRole}
 onChange={(event) => setSelectedRole(event.target.value as MockRole)}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none focus:border-brand"
 >
 {mockRoles.map((role) => (
 <option key={role} value={role}>{role}</option>
 ))}
 </select>
 </label>
 <p className="mt-3 text-sm text-muted">
 Platform Admin can see all actions. Platform Engineer owns infrastructure without platform settings. Developer cannot deploy to prod. Viewer cannot create or deploy.
 </p>
 </section>

 <section className="grid gap-6">
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Users</h2>
 <DataTable columns={["user", "email", "role", "team"]} rows={userRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Roles</h2>
 <DataTable columns={["role", "permissions", "current session"]} rows={roleRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Teams</h2>
 <DataTable columns={["team", "tenant", "scope", "selected"]} rows={teamRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Permission matrix</h2>
 <DataTable columns={["permission", "Platform Admin", "Platform Engineer", "Team Lead", "Developer", "Viewer"]} rows={permissionRows} />
 </article>
 </section>
 </>
 );
}

function permissionCell(role: MockRole, permission: Permission) {
 const allowed = rolePermissions[role].includes(permission);
 return <StatusBadge label={allowed ? "Allow" : "Deny"} tone={allowed ? "success" : "danger"} />;
}
