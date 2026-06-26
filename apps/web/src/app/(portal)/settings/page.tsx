import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { settings } from "@/lib/mock-data";
import Link from "next/link";

export default function SettingsPage() {
 return (
 <>
 <PageHeader
 title="Settings"
 description="Represent tenant, environment, authentication, and integration configuration as static placeholders for the Phase 1 portal shell."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Tenant mode" value="Mock scoped" detail="Topbar team switcher" />
 <StatCard label="Environments" value="3" detail="dev, stage, prod" />
 <StatCard label="Live connections" value="0" detail="No backend integrations yet" />
 </section>
 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Access control</h2>
 <p className="mt-2 text-sm text-muted">Preview mock users, roles, teams, permissions, and role-aware UI behavior.</p>
 <Link
 href="/settings/access-control"
 className="mt-4 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-brand"
 >
 Open access control
 </Link>
 </section>
 <DataTable columns={["name", "value"]} rows={settings} />
 </>
 );
}
