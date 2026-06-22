interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16.5" r=".5" fill="currentColor" />
        </svg>
      </div>

      <h2 className="mt-4 text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  );
}