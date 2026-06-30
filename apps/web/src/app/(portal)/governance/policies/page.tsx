import { PolicyCatalogView } from "@/components/GovernanceViews";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default function GovernancePoliciesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policy and governance"
        title="Policy Catalog"
        description="Kyverno-style policy definitions, status, severity, enforcement mode, ownership, and remediation guidance."
        action={
          <Link href="/governance/violations" className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-canvas">
            View Violations
          </Link>
        }
      />
      <PolicyCatalogView />
    </>
  );
}
