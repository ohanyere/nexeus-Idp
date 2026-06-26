"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { mockRoles, mockTenantTeams, navigation } from "@/lib/mock-data";
import type { MockRole } from "@/lib/mock-data";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Topbar() {
 const { selectedTeam, selectedTeamId, setSelectedTeamId, selectedRole, setSelectedRole } = useMockSession();
 const pathname = usePathname();

 return (
 <header className="sticky top-0 z-30 border-b border-line bg-white">
 <div className="flex min-h-14 min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-5 lg:px-6">
 <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-canvas px-3 py-1.5 text-xs text-muted lg:max-w-md">
 <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
 <span className="truncate">Search services, teams, deployments, resources</span>
 </div>
 <div className="flex min-w-0 flex-wrap items-center gap-3">
 <label className="grid gap-1 text-xs font-medium text-muted">
 Team scope
 <select
 value={selectedTeamId}
 onChange={(event) => setSelectedTeamId(event.target.value)}
 className="h-8 max-w-[170px] rounded-md border border-line bg-white px-2 text-xs font-medium text-ink outline-none focus:border-brand"
 >
 {mockTenantTeams.map((team) => (
 <option key={team.id} value={team.id}>{team.name}</option>
 ))}
 </select>
 </label>
 <label className="grid gap-1 text-xs font-medium text-muted">
 Mock role
 <select
 value={selectedRole}
 onChange={(event) => setSelectedRole(event.target.value as MockRole)}
 className="h-8 max-w-[170px] rounded-md border border-line bg-white px-2 text-xs font-medium text-ink outline-none focus:border-brand"
 >
 {mockRoles.map((role) => (
 <option key={role} value={role}>{role}</option>
 ))}
 </select>
 </label>
 <button
 type="button"
 className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate-700 hover:bg-canvas"
 aria-label="Notifications"
 >
 <Bell className="h-4 w-4" aria-hidden="true" />
 </button>
 <div className="hidden text-right sm:block">
 <p className="text-sm font-semibold text-ink">Avery Morgan</p>
 <p className="text-xs text-muted">{selectedTeam.tenant} · {selectedRole}</p>
 <p className="max-w-xs truncate text-xs text-muted">{selectedTeam.scope}</p>
 </div>
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">
 AM
 </div>
 </div>
 </div>
 <nav className="min-w-0 max-w-full overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
 <div className="flex min-w-max gap-2">
 {navigation.map((item) => {
 const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

 return (
 <Link
 key={item.href}
 href={item.href}
 className={active
 ? "rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white"
 : "rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"}
 >
 {item.name}
 </Link>
 );
 })}
 </div>
 </nav>
 </header>
 );
}
