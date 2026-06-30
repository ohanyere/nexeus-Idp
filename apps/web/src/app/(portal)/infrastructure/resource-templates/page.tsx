import { ResourceTemplatesView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";

export default function ResourceTemplatesPage() {
  return (
    <>
      <PageHeader title="Resource Templates" description="Reusable infrastructure templates for common developer self-service requests." />
      <ResourceTemplatesView />
    </>
  );
}
