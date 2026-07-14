import Link from "next/link";

interface PageHeaderProps {
 title: string;
 subtitle?: string;
 backHref?: string;
}

export function PageHeader({
 title,
 subtitle,
 backHref,
}: PageHeaderProps) {
 return (
 <header className="flex items-start gap-3">
 {backHref && (
 <Link
 href={backHref}
 aria-label="Go back"
 className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <span
 aria-hidden="true"
 className="h-3 w-3 rotate-45 border-b-2 border-l-2 border-border"
 />
 </Link>
 )}

 <div>
 <h1 className="text-2xl font-bold tracking-tight">
 {title}
 </h1>

 {subtitle && (
 <p className="mt-2 text-sm text-muted-foreground">
 {subtitle}
 </p>
 )}
 </div>
 </header>
 );
}
