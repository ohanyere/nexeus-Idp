type PageHeaderProps = {
 title: string;
 description: string;
 eyebrow?: string;
 action?: React.ReactNode;
};

export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
 return (
 <div className="border-b border-line pb-4">
 <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
 <div className="min-w-0">
 {eyebrow ? (
 <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
 ) : null}
 <h1 className="mt-1 max-w-5xl font-heading text-2xl font-semibold leading-tight text-ink sm:text-3xl">{title}</h1>
 <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
 </div>
 {action ? <div className="shrink-0">{action}</div> : null}
 </div>
 </div>
 );
}
