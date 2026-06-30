"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { mockNotifications } from "@/lib/auth";
import { mockRoles, navigation, teams } from "@/lib/mock-data";
import type { MockRole } from "@/lib/mock-data";
import { Bell, ChevronDown, LogOut, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

export function Topbar() {
 const { selectedTeam, selectedTeamId, setSelectedTeamId, selectedRole, setSelectedRole, user, can } = useMockSession();
 const pathname = usePathname();
 const [menuOpen, setMenuOpen] = useState(false);
 const unread = mockNotifications.filter((notification) => notification.status === "Unread").length;
 const visibleNavigation = navigation.filter((item) => !item.permission || can(item.permission));

 return (
 <header className="sticky top-0 z-30 border-b border-line bg-white">
 <div className="flex min-h-14 min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-5 lg:px-6">
 <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-canvas px-3 py-1.5 text-xs text-muted lg:max-w-md">
 <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
 <span className="truncate">Search services, teams, deployments, resources, templates, requests</span>
 </div>
 <div className="flex min-w-0 flex-wrap items-center gap-3">
 <label className="hidden gap-1 text-xs font-medium text-muted xl:grid">
 Team scope
 <select
 value={selectedTeamId}
 onChange={(event) => setSelectedTeamId(event.target.value)}
 className="h-8 max-w-[170px] rounded-md border border-line bg-white px-2 text-xs font-medium text-ink outline-none focus:border-brand"
 >
 {teams.map((team) => (
 <option key={team.id} value={team.id}>{team.name}</option>
 ))}
 </select>
 </label>
 <label className="hidden gap-1 text-xs font-medium text-muted xl:grid">
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
 <Link
 href="/notifications"
 className="relative flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate-700 hover:bg-canvas"
 aria-label="Notifications"
 >
 <Bell className="h-4 w-4" aria-hidden="true" />
 {unread ? <span className="absolute mt-[-1.15rem] ml-5 h-2 w-2 rounded-full bg-red-600" /> : null}
 </Link>
 <div className="hidden text-right sm:block">
 <p className="text-sm font-semibold text-ink">{user.name}</p>
 <p className="text-xs text-muted">{selectedTeam.name} · {selectedRole}</p>
 <p className="max-w-xs truncate text-xs text-muted">{user.email}</p>
 </div>
 <div className="relative">
 <button
 type="button"
 onClick={() => setMenuOpen((open) => !open)}
 className="flex h-8 items-center gap-1 rounded-md bg-slate-900 px-2 text-xs font-semibold text-white"
 aria-label="Open user menu"
 >
 <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10">{user.avatar}</span>
 <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 {menuOpen ? (
 <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-line bg-white shadow-lg">
 <div className="border-b border-line px-3 py-2">
 <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
 <p className="truncate text-xs text-muted">{user.email}</p>
 </div>
 <MenuLink href="/profile" icon={<UserCircle className="h-4 w-4" />}>Profile</MenuLink>
 <MenuLink href={`/teams/${selectedTeam.id}`}>My Team</MenuLink>
 <MenuLink href="/settings">Settings</MenuLink>
 <MenuLink href="/settings/api-keys">API Keys</MenuLink>
 <MenuLink href="/notifications">Notifications</MenuLink>
 <MenuLink href="/login" icon={<LogOut className="h-4 w-4" />}>Logout</MenuLink>
 </div>
 ) : null}
 </div>
 </div>
 </div>
 <nav className="min-w-0 max-w-full overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
 <div className="flex min-w-max gap-2">
 {visibleNavigation.map((item) => {
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

function MenuLink({ href, children, icon }: { href: string; children: ReactNode; icon?: ReactNode }) {
 return (
 <Link href={href} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-canvas hover:text-slate-950">
 {icon}
 <span>{children}</span>
 </Link>
 );
}
