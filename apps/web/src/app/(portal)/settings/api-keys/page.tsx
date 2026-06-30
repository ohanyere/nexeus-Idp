import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { mockApiKeys } from "@/lib/auth";

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader title="API Keys" description="Mock personal and automation keys for future authenticated API access." />
      <section className="console-panel rounded-md">
        <div className="divide-y divide-line">
          {mockApiKeys.map((key) => (
            <article key={key.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-center">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-ink">{key.name}</h2>
                <p className="mt-1 font-mono text-xs text-muted">{key.scope}</p>
              </div>
              <p className="text-xs text-muted">Last used {key.lastUsed}</p>
              <StatusBadge label={key.status} tone={key.status === "Active" ? "success" : "warning"} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
