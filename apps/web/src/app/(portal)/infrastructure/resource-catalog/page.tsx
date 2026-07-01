import { ResourceCatalogView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";

export default function ResourceCatalogPage() {
  return (
    <>
      <PageHeader title="Resource Catalog" description="Self-service infrastructure catalog that generates Crossplane claims and opens GitOps pull requests for approval." action={<ProvisionResourceButton label="Provision through GitOps" />} />
      <ResourceCatalogView />
    </>
  );
}
