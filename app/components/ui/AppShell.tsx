import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function AppShell({
  children,
  maxWidth = "md",
}: AppShellProps) {
  const widths = {
    sm: "max-w-md",
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className={`mx-auto w-full ${widths[maxWidth]}`}>
        {children}
      </div>
    </main>
  );
}