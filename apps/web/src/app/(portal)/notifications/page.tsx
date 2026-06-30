import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { mockNotifications } from "@/lib/auth";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Mock notification center for deployments, approvals, rollbacks, policy violations, and team invitations." />
      <section className="grid gap-3 md:grid-cols-5">
        {["Deployment", "Approval", "Rollback", "Policy", "Invitation"].map((category) => (
          <div key={category} className="console-panel rounded-md p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{category}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{mockNotifications.filter((notification) => notification.category === category).length}</p>
          </div>
        ))}
      </section>
      <section className="console-panel rounded-md">
        <div className="divide-y divide-line">
          {mockNotifications.map((notification) => (
            <article key={notification.id} className="grid gap-3 px-4 py-3 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-center">
              <p className="text-xs font-semibold uppercase text-muted">{notification.category}</p>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-ink">{notification.title}</h2>
                <p className="mt-1 text-xs text-muted">{notification.detail} · {notification.time}</p>
              </div>
              <StatusBadge label={notification.status} tone={notification.status === "Unread" ? "warning" : "neutral"} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
