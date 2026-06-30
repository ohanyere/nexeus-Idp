"use client";

import clsx from "clsx";
import { SquareStack } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/mock-data";
import { useMockSession } from "@/components/MockSessionContext";

const navigationGroups = ["Platform", "Catalog", "Operations", "Governance", "Admin"] as const;

export function AppSidebar() {
 const pathname = usePathname();
 const { can } = useMockSession();
 const visibleNavigation = navigation.filter((item) => !item.permission || can(item.permission));

 return (
 <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white text-slate-800 lg:flex lg:flex-col">
 <div className="flex h-12 items-center gap-2 border-b border-slate-200 px-3">
 <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-slate-950 text-white">
 <SquareStack className="h-3.5 w-3.5" aria-hidden="true" />
 </div>
 <div className="min-w-0">
 <p className="truncate font-heading text-[0.82rem] font-semibold text-slate-950">Nexus Platform</p>
 <p className="truncate text-[0.66rem] font-medium text-slate-500">Internal Developer Platform</p>
 </div>
 </div>
 <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 py-2.5">
 {navigationGroups.map((group) => {
 const items = visibleNavigation.filter((item) => item.group === group);

 if (!items.length) {
 return null;
 }

 return (
 <div key={group}>
 <p className="px-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{group}</p>
 <div className="mt-1 grid gap-0.5">
 {items.map((item) => {
 const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
 const Icon = item.icon;

 return (
 <Link
 key={item.href}
 href={item.href}
 className={clsx(
 "group flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[0.82rem] font-medium transition",
 active
 ? "bg-slate-950 text-white"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
 )}
 >
 <span className={clsx(
 "flex h-6 w-6 shrink-0 items-center justify-center rounded transition",
 active ? "text-slate-100" : "text-slate-500 group-hover:text-slate-800"
 )}>
 <Icon className="h-3.5 w-3.5" aria-hidden="true" />
 </span>
 <span className="truncate">{item.name}</span>
 </Link>
 );
 })}
 </div>
 </div>
 );
 })}
 </nav>
 <div className="border-t border-slate-200 px-4 py-3">
 <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant</p>
 <p className="mt-1 truncate text-xs font-semibold text-slate-900">Nexus Platform Demo</p>
 <p className="mt-0.5 text-[0.7rem] leading-4 text-slate-500">Internal developer workspace</p>
 </div>
 </aside>
 );
}
