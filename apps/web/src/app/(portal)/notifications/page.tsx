import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default function NotificationsPage() {
  const categories = ["Deployment", "Approval", "Rollback", "Policy", "Invitation"];

  return (
    <>
      <PageHeader title="Notifications" description="Notifications from configured runtime and workflow integrations." />
      <section className="grid gap-3 md:grid-cols-5">
        {categories.map((category) => (
          <div key={category} className="console-panel rounded-md p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{category}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">0</p>
          </div>
        ))}
      </section>
      <section className="console-panel rounded-md p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <StatusBadge label="No notifications yet" tone="neutral" source="Seed" />
          <div>
            <h2 className="text-sm font-semibold text-ink">No notifications yet</h2>
            <p className="mt-1 text-sm text-muted">Runtime notification delivery is not configured for this workspace.</p>
          </div>
        </div>
      </section>
    </>
  );
}
