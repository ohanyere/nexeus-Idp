import { ResourceTemplatesView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";

export default function ResourceTemplatesPage() {
  const configuredRepositoryOwner = process.env.GITHUB_ORG?.trim() || process.env.GITHUB_OWNER?.trim();

  return (
    <>
      <PageHeader title="Resource Templates" description="Reusable infrastructure templates for common developer self-service requests." />
      <ResourceTemplatesView configuredRepositoryOwner={configuredRepositoryOwner} />
    </>
  );
}
