import Link from "next/link";

type ServiceDetailTabsProps = {
 serviceId: string;
};

const tabs = [
 { label: "Overview", hash: "overview" },
 { label: "Topology", hash: "topology" },
 { label: "Release Timeline", hash: "release-timeline" },
 { label: "Resources", hash: "resources" },
 { label: "Releases", hash: "releases" },
 { label: "Audit", hash: "audit" }
];

export function ServiceDetailTabs({ serviceId }: ServiceDetailTabsProps) {
 return (
 <nav className="sticky top-0 z-10 -mx-1 overflow-x-auto border-b border-line bg-white/95 px-1 py-2 backdrop-blur" aria-label="Service details">
 <div className="flex min-w-max items-center gap-1">
 {tabs.map((tab) => (
 <Link
 key={tab.hash}
 href={`/services/${serviceId}#${tab.hash}`}
 className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-canvas hover:text-slate-950"
 >
 {tab.label}
 </Link>
 ))}
 </div>
 </nav>
 );
}
