import { ReactNode } from "react";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg";
}

export function PageSection({
  children,
  className = "",
  spacing = "md",
}: PageSectionProps) {
  const gaps = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  return (
    <section className={`flex flex-col ${gaps[spacing]} ${className}`}>
      {children}
    </section>
  );
}