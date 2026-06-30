import { ResourceCatalogView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";

export default function ResourceCatalogPage() {
  return (
    <>
      <PageHeader title="Resource Catalog" description="Marketplace of self-service infrastructure resources backed by typed mock data for future Crossplane claims." action={<ProvisionResourceButton label="Provision Resource" />} />
      <ResourceCatalogView />
    </>
  );
}
