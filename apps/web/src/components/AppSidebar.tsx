"use client";

import clsx from "clsx";
import { Boxes } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/mock-data";

const navigationGroups = ["Platform", "Catalog", "Operations", "Governance", "Admin"] as const;

export function AppSidebar() {
 const pathname = usePathname();

 return (
 <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800 bg-sidebar text-slate-200 lg:flex lg:flex-col">
 <div className="flex h-14 items-center gap-2.5 border-b border-slate-800 px-4">
 <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-sidebar-soft text-slate-200">
 <Boxes className="h-4 w-4" aria-hidden="true" />
 </div>
 <div className="min-w-0">
 <p className="truncate font-heading text-sm font-semibold text-white">Senior IDP</p>
 <p className="truncate text-[0.7rem] font-medium text-slate-500">Platform control plane</p>
 </div>
 </div>
 <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
 {navigationGroups.map((group) => {
 const items = navigation.filter((item) => item.group === group);

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
 ? "bg-slate-800 text-white"
 : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
 )}
 >
 <span className={clsx(
 "flex h-6 w-6 shrink-0 items-center justify-center rounded transition",
 active ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300"
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
 <div className="border-t border-slate-800 px-4 py-3">
 <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant</p>
 <p className="mt-1 truncate text-xs font-semibold text-slate-200">Senior Platform Demo</p>
 <p className="mt-0.5 text-[0.7rem] leading-4 text-slate-500">Mock-only workspace</p>
 </div>
 </aside>
 );
}
