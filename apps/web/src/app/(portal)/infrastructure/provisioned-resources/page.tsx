import { ProvisionedResourcesView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";

export default function ProvisionedResourcesPage() {
  return (
    <>
      <PageHeader title="Provisioned Resources" description="Inventory of mock infrastructure claims, managed resources, owners, costs, and service links." />
      <ProvisionedResourcesView />
    </>
  );
}
