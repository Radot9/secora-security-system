import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
 className="apple-icon-button relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card"
 >
 <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
 </Link>
 )}

 <div>
 <h1 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
 {title}
 </h1>

 {subtitle && (
 <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
 {subtitle}
 </p>
 )}
 </div>
 </header>
 );
}
