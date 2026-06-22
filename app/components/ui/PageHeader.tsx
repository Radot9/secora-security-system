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
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <span
            aria-hidden="true"
            className="h-3 w-3 rotate-45 border-b-2 border-l-2 border-slate-700 dark:border-slate-200"
          />
        </Link>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}