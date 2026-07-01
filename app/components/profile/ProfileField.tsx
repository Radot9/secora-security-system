import { ReactNode } from "react";

interface ProfileFieldProps {
  label: string;
  value: ReactNode;
}

export default function ProfileField({
  label,
  value,
}: ProfileFieldProps) {
  return (
    <div className="flex items-start justify-between border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800">

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="text-right font-semibold text-slate-900 dark:text-white">
        {value}
      </p>

    </div>
  );
}