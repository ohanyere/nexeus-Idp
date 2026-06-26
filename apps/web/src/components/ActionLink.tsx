import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type ActionLinkProps = {
 href: string;
 label: string;
 icon: LucideIcon;
};

export function ActionLink({ href, label, icon: Icon }: ActionLinkProps) {
 return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-canvas"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-slate-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold">{label}</span>
      </span>
 </Link>
 );
}
