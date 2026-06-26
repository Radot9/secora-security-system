import { ReactNode } from "react";
import { Card } from "./Card";
import { SectionHeader } from "./SectionHeader";

interface CardSectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
}

export function CardSection({
  title,
  subtitle,
  actionLabel,
  actionHref,
  children,
  className = "",
}: CardSectionProps) {
  return (
    <Card className={`overflow-hidden p-0 ${className}`}>
      <div className="px-8 py-6">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          actionLabel={actionLabel}
          actionHref={actionHref}
        />
      </div>

      {children}
    </Card>
  );
}