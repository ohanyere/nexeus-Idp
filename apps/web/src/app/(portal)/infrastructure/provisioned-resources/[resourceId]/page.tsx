import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getProvisionedInfrastructureResource, provisionedInfrastructureResources } from "@/lib/infrastructure";
import { services } from "@/lib/mock-data";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProvisionedResourceDetailPageProps = {
  params: Promise<{ resourceId: string }>;
};

export function generateStaticParams() {
  return provisionedInfrastructureResources.map((resource) => ({ resourceId: resource.id }));
}

export default async function ProvisionedResourceDetailPage({ params }: ProvisionedResourceDetailPageProps) {
  const { resourceId } = await params;
  const resource = getProvisionedInfrastructureResource(resourceId);

  if (!resource) {
    notFound();
  }

  const linkedServices = services.filter((service) => resource.linkedServiceIds.includes(service.id));

  return (
    <>
      <PageHeader title={resource.name} description={`${resource.type} owned by ${resource.team} in ${resource.environment}. Legacy sample detail; GitOps-backed requests are tracked in the Provisioned Resources list.`} eyebrow="Provisioned resource" />
      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Overview">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <Meta label="Type" value={resource.type} />
            <Meta label="Owner" value={resource.owner} />
            <Meta label="Provider" value={resource.provider} />
            <Meta label="Region" value={resource.region} />
            <Meta label="Estimated Cost" value={resource.estimatedCost} />
            <div><dt className="font-medium text-muted">Status</dt><dd className="mt-1"><StatusBadge label={resource.status} tone={resource.tone} /></dd></div>
          </dl>
        </Panel>
        <Panel title="Configuration">
          <KeyValues values={resource.configuration} />
        </Panel>
        <Panel title="Timeline">
          <List items={resource.audit.map((event) => `${event.time} · ${event.event} · ${event.actor}`)} />
        </Panel>
        <Panel title="Events">
          <List items={resource.events} />
        </Panel>
        <Panel title="Labels">
          <KeyValues values={resource.labels} />
        </Panel>
        <Panel title="Linked Services">
          <div className="grid gap-2">
            {linkedServices.map((service) => <Link key={service.id} href={`/services/${service.id}`} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-canvas">{service.name}</Link>)}
          </div>
        </Panel>
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

function KeyValues({ values }: { values: Record<string, string> }) {
  return <dl className="grid gap-2 text-sm">{Object.entries(values).map(([key, value]) => <div key={key} className="flex justify-between gap-3 rounded-md bg-canvas px-3 py-2"><dt className="font-medium text-muted">{key}</dt><dd className="font-semibold text-slate-900">{value}</dd></div>)}</dl>;
}

function List({ items }: { items: string[] }) {
  return <div className="grid gap-2">{items.map((item) => <div key={item} className="rounded-md bg-canvas px-3 py-2 text-sm text-slate-700">{item}</div>)}</div>;
}
