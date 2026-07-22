"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { StatusBadge } from "@/components/StatusBadge";
import { getPersonalDashboard } from "@/lib/auth";
import { auditLogs } from "@/lib/mock-data";
import Link from "next/link";
import type { ReactNode } from "react";

export function PersonalDashboard() {
  const { user, can } = useMockSession();
  const dashboard = getPersonalDashboard(user);

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="My Services" value={String(dashboard.myServices.length)} detail={user.team} />
        <Metric label="Pending Promotions" value={String(dashboard.pendingPromotions.length)} detail="Needs review or completion" />
        <Metric label="Pending Rollbacks" value={String(dashboard.pendingRollbacks.length)} detail="Rollback-ready releases" />
        <Metric label="Notifications" value={String(dashboard.notifications.filter((item) => item.status === "Unread").length)} detail="Unread items" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <Panel title="My Services" detail="Services connected to your team or ownership.">
            {dashboard.myServices.map((service) => (
              <Row key={service.id} href={`/services/${service.id}`} title={service.name} detail={`${service.team} · ${service.currentVersion}`}>
                <StatusBadge label={service.deploymentStatus} tone={service.deploymentTone} />
              </Row>
            ))}
          </Panel>

          <Panel title="Recent Deployments" detail="Latest deployments in environments you can access.">
            {dashboard.recentDeployments.map((deployment) => (
              <Row key={deployment.id} href={`/deployments/${deployment.id}`} title={`${deployment.service} ${deployment.version}`} detail={`${deployment.environment} · ${deployment.deployedAt}`}>
                <StatusBadge label={deployment.status} tone={deployment.tone} />
              </Row>
            ))}
          </Panel>
        </div>

        <div className="grid content-start gap-4">
          <Panel title="My Team" detail="Current authenticated team scope.">
            {dashboard.myTeams.map((team) => (
              <Row key={team.id} href={`/teams/${team.id}`} title={team.name} detail={`${team.members.length} shown members · ${team.slackChannel}`}>
                <StatusBadge label={user.role} />
              </Row>
            ))}
          </Panel>

          <section className="console-panel rounded-md p-4">
            <h2 className="font-heading text-base font-semibold text-ink">Quick Actions</h2>
            <div className="mt-3 grid gap-2">
              {can("create service") ? <QuickAction href="/services/create" label="Create service" /> : null}
              {can("deploy to dev") ? <QuickAction href="/deployments" label="Open deployments" /> : null}
              {can("manage teams") ? <QuickAction href="/teams" label="Manage teams" /> : null}
              <QuickAction href="/notifications" label="View notifications" />
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Audit Activity" detail="Recent activity relevant to releases and access.">
          {auditLogs.slice(0, 5).map((log) => (
            <Row key={`${log.actor}-${log.action}-${log.time}`} title={log.action} detail={`${log.actor} · ${log.target} · ${log.time}`}>
              <StatusBadge label={log.result} />
            </Row>
          ))}
        </Panel>
        <Panel title="Platform Notifications" detail="Recent platform notification activity.">
          {dashboard.notifications.map((notification) => (
            <Row key={notification.id} href="/notifications" title={notification.title} detail={`${notification.category} · ${notification.time}`}>
              <StatusBadge label={notification.status} tone={notification.status === "Unread" ? "warning" : "neutral"} />
            </Row>
          ))}
        </Panel>
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="console-panel rounded-md p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </section>
  );
}

function Panel({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <section className="console-panel min-w-0 rounded-md">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-xs text-muted">{detail}</p>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ title, detail, href, children }: { title: string; detail: string; href?: string; children: ReactNode }) {
  const content = (
    <article className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 truncate text-xs text-muted">{detail}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </article>
  );

  return href ? <Link href={href} className="block hover:bg-canvas">{content}</Link> : content;
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-canvas">
      {label}
    </Link>
  );
}
