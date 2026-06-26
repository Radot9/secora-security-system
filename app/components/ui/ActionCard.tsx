import Link from "next/link";
import { ReactNode } from "react";
import { Card } from "./Card";

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

export function ActionCard({
  title,
  description,
  href,
  icon,
}: ActionCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="transition hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/20">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="font-semibold">{title}</h3>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>

          <div className="rounded-xl bg-teal-50 p-3 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400">
            {icon}
          </div>
        </div>
      </Card>
    </Link>
  );
}