import { PolicyViolationsView } from "@/components/GovernanceViews";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default function GovernanceViolationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policy and governance"
        title="Policy Violations"
        description="Filter service policy findings by severity, team, service, environment, and remediation status."
        action={
          <Link href="/governance/policies" className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-canvas">
            Policy Catalog
          </Link>
        }
      />
      <PolicyViolationsView />
    </>
  );
}
