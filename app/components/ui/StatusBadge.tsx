interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    entered:
      "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",

    pending: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",

    exited: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",

    expired:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",

    revoked: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status as keyof typeof styles] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
