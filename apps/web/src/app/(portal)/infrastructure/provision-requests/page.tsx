import { ProvisionRequestsView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";

export default function ProvisionRequestsPage() {
  return (
    <>
      <PageHeader title="Provision Requests" description="Mock approval workflow from developer request to platform engineer approval and provisioning." action={<ProvisionResourceButton label="New Request" />} />
      <ProvisionRequestsView />
    </>
  );
}
