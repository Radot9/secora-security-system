"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, ShieldCheck, UsersRound } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatCard } from "@/app/components/ui/StatCard";
import { getDisplayVisitorStatus } from "@/lib/visitor-status";

type AnalyticsVisitor = {
 id: string;
 status: string;
 created_at: string;
 expires_at: string | null;
};

export default function AnalyticsPage() {
 const [visitors, setVisitors] = useState<AnalyticsVisitor[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let isMounted = true;

 async function loadAnalytics() {
 const { data, error } = await supabase
 .from("visitors")
 .select("id, status, created_at, expires_at")
 .order("created_at", { ascending: false })
 .limit(1000);

 if (!isMounted) return;

 if (!error && data) {
 setVisitors(data);
 }

 setLoading(false);
 }

 void loadAnalytics();

 return () => {
 isMounted = false;
 };
 }, []);

 const stats = useMemo(() => {
 const now = new Date();
 const startOfToday = new Date(
 now.getFullYear(),
 now.getMonth(),
 now.getDate(),
 );

 const visitorsToday = visitors.filter(
 (visitor) => new Date(visitor.created_at) >= startOfToday,
 ).length;
 const currentlyInside = visitors.filter(
 (visitor) => visitor.status === "entered",
 ).length;
 const completedVisits = visitors.filter(
 (visitor) => visitor.status === "exited",
 ).length;
 const expiredOrRevoked = visitors.filter((visitor) => {
 return (
 visitor.status === "revoked" ||
 (visitor.status === "pending" &&
 visitor.expires_at &&
 new Date(visitor.expires_at) < now)
 );
 }).length;

 return {
 visitorsToday,
 currentlyInside,
 completedVisits,
 expiredOrRevoked,
 };
 }, [visitors]);

 const statusRows = useMemo(() => {
 const totals = new Map<string, number>();

 visitors.forEach((visitor) => {
 const status = getDisplayVisitorStatus({ status: visitor.status, expiresAt: visitor.expires_at });

 totals.set(status, (totals.get(status) || 0) + 1);
 });

 return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
 }, [visitors]);

 return (
 <AppShell size="wide">
 <div className="flex flex-col gap-6">
 <PageHeader
 title="Analytics"
 subtitle="Track visitor volume, estate occupancy and pass outcomes"
 />

 {loading ? (
 <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
 Loading analytics...
 </div>
 ) : (
 <>
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <StatCard
 label="Visitors today"
 value={stats.visitorsToday}
 icon={<UsersRound className="h-6 w-6 text-primary" />}
 />
 <StatCard
 label="Currently inside"
 value={stats.currentlyInside}
 icon={<Clock3 className="h-6 w-6 text-primary" />}
 />
 <StatCard
 label="Completed visits"
 value={stats.completedVisits}
 icon={<ShieldCheck className="h-6 w-6 text-primary" />}
 />
 <StatCard
 label="Expired or revoked"
 value={stats.expiredOrRevoked}
 icon={<Activity className="h-6 w-6 text-destructive" />}
 />
 </section>

 <Card>
 <h2 className="text-lg font-semibold">Visitor status mix</h2>

 {statusRows.length === 0 ? (
 <p className="mt-6 text-sm text-muted-foreground">
 No visitor records available yet.
 </p>
 ) : (
 <div className="mt-6 flex flex-col gap-4">
 {statusRows.map(([status, count]) => {
 const width = visitors.length
 ? `${Math.max((count / visitors.length) * 100, 6)}%`
 : "0%";

 return (
 <div key={status}>
 <div className="mb-2 flex items-center justify-between text-sm">
 <span className="font-medium capitalize">
 {status}
 </span>
 <span className="text-muted-foreground">{count}</span>
 </div>
 <div className="h-3 rounded-full bg-muted">
 <div
 className="h-3 rounded-full bg-primary/100"
 style={{ width }}
 />
 </div>
 </div>
 );
 })}
 </div>
 )}
 </Card>
 </>
 )}
 </div>
 </AppShell>
 );
}
