import { ResourceCatalogView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";

export default function ResourceCatalogPage() {
  const configuredRepositoryOwner = process.env.GITHUB_ORG?.trim() || process.env.GITHUB_OWNER?.trim();

  return (
    <>
      <PageHeader title="Resource Catalog" description="Self-service infrastructure catalog that generates Crossplane claims and opens GitOps pull requests for approval." action={<ProvisionResourceButton configuredRepositoryOwner={configuredRepositoryOwner} label="Provision through GitOps" />} />
      <ResourceCatalogView configuredRepositoryOwner={configuredRepositoryOwner} />
    </>
  );
}
