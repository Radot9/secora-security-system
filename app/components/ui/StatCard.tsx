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
 <Card className="stat-card">
 {icon && (
 <div className="mb-4">
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
}
