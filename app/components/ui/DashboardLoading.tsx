import { BrandMark } from "./BrandMark";
import { LoadingSpinner } from "./LoadingSpinner";

export function DashboardRouteLoading({ label = "Preparing your dashboard" }: { label?: string }) {
 return (
 <main
 role="status"
 aria-live="polite"
 className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-background px-6 text-foreground"
 >
 <div className="apple-card flex w-full max-w-sm flex-col items-center rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-xl">
 <BrandMark />
 <LoadingSpinner className="mt-6 h-6 w-6 text-primary" />
 <p className="mt-4 font-semibold">{label}</p>
 <p className="mt-2 text-sm text-muted-foreground">Loading your secure workspace…</p>
 </div>
 </main>
 );
}

export function DashboardLoadingNotice({ label = "Loading live dashboard data…" }: { label?: string }) {
 return (
 <div
 role="status"
 aria-live="polite"
 className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground"
 >
 <LoadingSpinner className="h-4 w-4 shrink-0 text-primary" />
 <span>{label}</span>
 </div>
 );
}
