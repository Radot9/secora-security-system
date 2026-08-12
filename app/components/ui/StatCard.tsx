import { ReactNode } from "react";
import Link from "next/link";
import { Card } from "./Card";

interface StatCardProps {
 label: string;
 value: string | number;
 icon?: ReactNode;
 href?: string;
 ariaLabel?: string;
}

export function StatCard({
 label,
 value,
 icon,
 href,
 ariaLabel,
}: StatCardProps) {
 const content = (
 <Card className="stat-card">
 {icon && (
 <div className="stat-card__icon mb-4 text-primary">
 {icon}
 </div>
 )}

 <p className="text-3xl font-bold tracking-[-0.035em] tabular-nums">
 {value}
 </p>

 <p className="mt-2 text-sm text-muted-foreground">
 {label}
 </p>
 </Card>
 );

 if (href) {
 return <Link href={href} aria-label={ariaLabel ?? `View ${label}`} className="interactive-card block h-full">{content}</Link>;
 }

 return content;
}
