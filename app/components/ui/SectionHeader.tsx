import Link from "next/link";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-1 text-teal-600 dark:text-teal-400">
            {icon}
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}