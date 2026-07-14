import { ActivityItem } from "@/types/activity";

interface ActivityTableProps {
 activity: ActivityItem[];
 setSelectedVisitor: (visitor: ActivityItem) => void;
 getVisitorStatus: (visitor: ActivityItem) => string;
}

export default function ActivityTable({
 activity,
 setSelectedVisitor,
 getVisitorStatus,
}: ActivityTableProps) {
 return (
 <section>
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold tracking-tight">
 Recent Verification
 </h2>

 <button
 type="button"
 className="text-sm font-medium text-primary transition hover:text-primary/80"
 >
 View all
 </button>
 </div>

 <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-muted/50">
 {activity.map((item) => {
 const displayStatus = getVisitorStatus(item);

 const isDenied =
 displayStatus === "expired" || displayStatus === "revoked";

 return (
 <article
 key={item.id}
 onClick={() => setSelectedVisitor(item)}
 className="cursor-pointer flex items-center gap-4 border-b border-border px-5 py-5 last:border-b-0 hover:bg-background"
 >
 <span
 className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
 isDenied
 ? "bg-destructive/10 text-destructive"
 : "bg-primary/10 text-primary"
 }`}
 >
 <svg
 viewBox="0 0 24 24"
 className="h-6 w-6"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 >
 {isDenied ? (
 <path d="m6 6 12 12M18 6 6 18" />
 ) : (
 <path d="m5 13 4 4L19 7" />
 )}
 </svg>
 </span>

 <div className="min-w-0 flex-1">
 <h3 className="font-bold">{item.visitor_name}</h3>

 <p className="mt-1 truncate text-sm text-muted-foreground">
 Code: {item.access_code} •{" "}
 <span
 className={
 displayStatus === "entered"
 ? "text-primary font-semibold"
 : displayStatus === "pending"
 ? "text-accent-foreground font-semibold"
 : displayStatus === "expired"
 ? "text-secondary-foreground font-semibold"
 : displayStatus === "revoked"
 ? "text-destructive font-semibold"
 : "text-muted-foreground font-semibold"
 }
 >
 {displayStatus}
 </span>
 </p>
 </div>

 <time className="text-sm text-muted-foreground">
 {new Date(item.created_at).toLocaleTimeString()}
 </time>
 </article>
 );
 })}
 </div>
 </section>
 );
}
