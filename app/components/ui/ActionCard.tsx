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
 <Card className="transition hover:border-primary/40 hover:bg-primary/10">
 <div className="flex items-start justify-between gap-6">
 <div>
 <h3 className="font-semibold">{title}</h3>

 <p className="mt-2 text-sm text-muted-foreground">
 {description}
 </p>
 </div>

 <div className="rounded-xl bg-primary/10 p-3 text-primary">
 {icon}
 </div>
 </div>
 </Card>
 </Link>
 );
}