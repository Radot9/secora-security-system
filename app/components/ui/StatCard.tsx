import { ReactNode } from "react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <Card>
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}

      <p className="text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {label}
      </p>
    </Card>
  );
}