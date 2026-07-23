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
 <div>
 <h2 className="text-xl font-bold tracking-tight">Recent Verifications</h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Completed gate activity from the last 24 hours.
 </p>
 </div>

 <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-muted/50">
 {activity.length === 0 ? (
 <div className="px-5 py-14 text-center">
 <h3 className="font-semibold">No completed verification activity yet</h3>
 <p className="mt-2 text-sm text-muted-foreground">
 Checked-in and checked-out visitors will appear here.
 </p>
 </div>
 ) : (
 activity.map((item) => {
 const displayStatus = getVisitorStatus(item);
 const isDenied = displayStatus === "expired" || displayStatus === "revoked";

 return (
 <article
 key={item.id}
 onClick={() => setSelectedVisitor(item)}
 className="flex cursor-pointer items-center gap-4 border-b border-border px-5 py-5 last:border-b-0 hover:bg-background"
 >
 <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDenied ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
 <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
 {isDenied ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="m5 13 4 4L19 7" />}
 </svg>
 </span>

 <div className="min-w-0 flex-1">
 <h3 className="font-bold">{item.visitor_name}</h3>
 <p className="mt-1 truncate text-sm text-muted-foreground">
 <span className="font-semibold text-foreground">{displayStatus}</span> verification
 </p>
 </div>

 <time className="text-sm text-muted-foreground">
 {new Date(item.exit_time || item.entry_time || item.created_at).toLocaleTimeString()}
 </time>
 </article>
 );
 })
 )}
 </div>
 </section>
 );
}
