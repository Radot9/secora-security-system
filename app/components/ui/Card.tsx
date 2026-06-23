import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 ${className}`}
    >
      {children}
    </div>
  );
}