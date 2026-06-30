"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default function ProfilePage() {
  const { user } = useMockSession();

  return (
    <>
      <PageHeader title="User Profile" description="Mock authenticated identity, team assignment, permissions, and personal preferences." />
      <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="console-panel rounded-md p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-slate-950 text-xl font-semibold text-white">{user.avatar}</div>
          <h2 className="mt-4 font-heading text-xl font-semibold text-ink">{user.name}</h2>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label={user.role} />
            <StatusBadge label={user.status} tone={user.status === "Active" ? "success" : user.status === "Away" ? "warning" : "neutral"} />
          </div>
        </aside>
        <section className="console-panel rounded-md p-5">
          <h2 className="font-heading text-lg font-semibold text-ink">Profile details</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <Meta label="Team" value={user.team} />
            <Meta label="Role" value={user.role} />
            <Meta label="Time Zone" value={user.timeZone} />
            <Meta label="Last Active" value={user.lastActive} />
            <Meta label="Environment Access" value={user.environmentAccess.join(", ")} />
            <Meta label="Notification Preferences" value="Deployments, approvals, rollbacks, policy violations" />
          </dl>
        </section>
      </section>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
