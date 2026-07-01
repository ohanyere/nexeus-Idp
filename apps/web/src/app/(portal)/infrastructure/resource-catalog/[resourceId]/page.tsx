import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";
import { getResourceCatalogItem, resourceCatalog } from "@/lib/infrastructure";
import { notFound } from "next/navigation";

type ResourceCatalogDetailPageProps = {
  params: Promise<{ resourceId: string }>;
};

export function generateStaticParams() {
  return resourceCatalog.map((resource) => ({ resourceId: resource.id }));
}

export default async function ResourceCatalogDetailPage({ params }: ResourceCatalogDetailPageProps) {
  const { resourceId } = await params;
  const resource = getResourceCatalogItem(resourceId);

  if (!resource) {
    notFound();
  }

  return (
    <>
      <PageHeader title={resource.name} description={resource.description} eyebrow="Resource details" action={resource.gitOpsResourceId ? <ProvisionResourceButton resourceId={resource.id} label="Provision through GitOps" /> : null} />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <Panel title="Overview">
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <Meta label="Owner" value={resource.owner} />
              <Meta label="Provider" value={resource.provider} />
              <Meta label="Approval Required" value={resource.approvalRequired ? "Yes" : "No" } />
              <Meta label="Estimated Monthly Cost" value={resource.estimatedMonthlyCost} />
              <Meta label="Supported Environments" value={resource.supportedEnvironments.join(", ")} />
            </dl>
          </Panel>
          <Panel title="Parameters">
            <List items={resource.parameters} />
          </Panel>
          <Panel title="Example Use Cases">
            <List items={resource.useCases} />
          </Panel>
        </div>
        <div className="grid content-start gap-5">
          <Panel title="Architecture Diagram">
            <div className="grid gap-2 text-center text-xs font-semibold text-slate-700">
              <div className="rounded-md border border-line bg-canvas px-3 py-3">Developer request</div>
              <div>↓</div>
              <div className="rounded-md border border-line bg-canvas px-3 py-3">GitHub pull request approval</div>
              <div>↓</div>
              <div className="rounded-md border border-line bg-canvas px-3 py-3">ArgoCD syncs Crossplane claim</div>
              <div>↓</div>
              <div className="rounded-md border border-line bg-canvas px-3 py-3">{resource.name}</div>
            </div>
          </Panel>
          <Panel title="Dependencies">
            <List items={resource.dependencies} />
          </Panel>
        </div>
      </section>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="console-panel rounded-md p-5"><h2 className="font-heading text-lg font-semibold text-ink">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-medium text-muted">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>;
}

function List({ items }: { items: string[] }) {
  return <div className="flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full bg-canvas px-2 py-1 text-xs font-medium text-slate-700">{item}</span>)}</div>;
}
