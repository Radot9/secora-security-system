import { displayVisitorStatus } from "@/lib/visitor-status";

interface StatusBadgeProps {
 status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
 const styles = {
 entered: "bg-primary/15 text-primary",

 pending: "bg-accent text-accent-foreground",

 exited: "bg-muted text-muted-foreground",

 expired: "bg-secondary text-secondary-foreground",

 revoked: "bg-destructive/15 text-destructive",
 };

 return (
 <span
 aria-label={`Visitor status: ${displayVisitorStatus(status)}`}
 className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
 styles[status as keyof typeof styles] ?? "bg-muted text-muted-foreground"
 }`}
 >
 {displayVisitorStatus(status)}
 </span>
 );
}
