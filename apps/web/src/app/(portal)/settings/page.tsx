import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { settings } from "@/lib/mock-data";
import Link from "next/link";

export default function SettingsPage() {
 return (
 <>
 <PageHeader
 title="Settings"
 description="Review tenant, environment, authentication, and integration configuration."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Tenant mode" value="Team scoped" detail="Topbar team switcher" />
 <StatCard label="Environments" value="3" detail="dev, stage, prod" />
 <StatCard label="Live connections" value="0" detail="No backend integrations yet" />
 </section>
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 {[
 { title: "General", detail: "Tenant name, workspace mode, and environment defaults.", href: "/settings" },
 { title: "Notifications", detail: "Deployment, approval, rollback, policy, and invitation preferences.", href: "/notifications" },
 { title: "Integrations", detail: "Provider readiness for GitHub, Google, Microsoft, Keycloak, and Okta.", href: "/settings" },
 { title: "Access", detail: "Roles, users, permissions, and team-scoped visibility.", href: "/settings/access-control" },
 { title: "API Keys", detail: "Personal and automation keys for future API usage.", href: "/settings/api-keys" },
 { title: "Personal", detail: "Profile, time zone, notification preferences, and session details.", href: "/profile" }
 ].map((section) => (
 <Link key={section.title} href={section.href} className="console-panel rounded-md p-5 transition hover:bg-canvas">
 <h2 className="font-heading text-lg font-semibold text-ink">{section.title}</h2>
 <p className="mt-2 text-sm leading-6 text-muted">{section.detail}</p>
 </Link>
 ))}
 </section>
 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Current configuration</h2>
 <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
 {settings.map((setting) => (
 <div key={setting.name}>
 <dt className="font-medium text-muted">{setting.name}</dt>
 <dd className="mt-1 font-semibold text-slate-900">{setting.value}</dd>
 </div>
 ))}
 </dl>
 </section>
 </>
 );
}
