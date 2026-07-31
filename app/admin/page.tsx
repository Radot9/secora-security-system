"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 Activity,
 AlertTriangle,
 BarChart3,
 ChevronRight,
 ClipboardList,
 Clock3,
 DoorOpen,
 Home,
 Plus,
 Settings,
 ShieldCheck,
 UserCog,
 UserPlus,
 UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import {
 AccountStatusChart,
 MetricBarChart,
} from "@/app/components/ui/DashboardCharts";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatCard } from "@/app/components/ui/StatCard";
import { supabase } from "@/lib/supabase";
import { displayVisitorStatus, visitorStatusClassName } from "@/lib/visitor-status";

type RecentVisitor = {
 id: string;
 visitor_name: string;
 resident_name: string;
 status: string | null;
 created_at: string | null;
};

type AdminOverview = {
 access: {
 visitorsToday: number;
 currentlyInside: number;
 checkedOut: number;
 pendingPasses: number;
 revokedPasses: number;
 };
 estateAccounts: {
 activeResidents: number;
 inactiveResidents: number;
 activeSecurity: number;
 inactiveSecurity: number;
 };
 recentVisitors: RecentVisitor[];
};

const fallbackOverview: AdminOverview = {
 access: {
 visitorsToday: 0,
 currentlyInside: 0,
 checkedOut: 0,
 pendingPasses: 0,
 revokedPasses: 0,
 },
 estateAccounts: {
 activeResidents: 0,
 inactiveResidents: 0,
 activeSecurity: 0,
 inactiveSecurity: 0,
 },
 recentVisitors: [],
};

const actionGroups = [
 {
 title: "Access operations",
 description: "Monitor and audit visitor movement across the estate.",
 actions: [
 { label: "Currently Inside", href: "/admin/currently-inside", description: "See every visitor still inside the estate.", icon: DoorOpen },
 { label: "Visitor History", href: "/admin/visitor-history", description: "Review visitor records, check-ins, and exits.", icon: ClipboardList },
 { label: "Access Logs", href: "/admin/access-logs", description: "Audit code verification activity across gates.", icon: Activity },
 ],
 },
 {
 title: "People & administration",
 description: "Manage estate accounts, teams, and operating preferences.",
 actions: [
 { label: "Residents", href: "/admin/residents", description: "Manage resident profiles and estate homes.", icon: UsersRound },
 { label: "Security Personnel", href: "/admin/security", description: "Manage gate officers, teams, and status.", icon: ShieldCheck },
 { label: "Analytics", href: "/admin/analytics", description: "Track visitor flow and operational trends.", icon: BarChart3 },
 { label: "Profile & Settings", href: "/admin/settings", description: "Review your profile and estate preferences.", icon: Settings },
 ],
 },
];

const createActions = [
 { label: "Create Resident", href: "/admin/residents/new", description: "Add a resident profile and generate login credentials.", icon: UserPlus },
 { label: "Create Security", href: "/admin/security/new", description: "Add a gate officer and assign their duty team.", icon: ShieldCheck },
];

function formatDate(value: string | null) {
 if (!value) return "No date";
 return new Intl.DateTimeFormat(undefined, {
 dateStyle: "medium",
 timeStyle: "short",
 }).format(new Date(value));
}

export default function AdminPage() {
 const [overview, setOverview] = useState<AdminOverview>(fallbackOverview);
 const [isSuperAdmin, setIsSuperAdmin] = useState(false);
 const [loading, setLoading] = useState(true);

 const loadOverview = useCallback(async () => {
 const now = new Date();
 const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

 const [
 visitorsToday,
 currentlyInside,
 checkedOut,
 pendingPasses,
 revokedPasses,
 activeResidents,
 inactiveResidents,
 activeSecurity,
 inactiveSecurity,
 recentVisitors,
 authUser,
 ] = await Promise.all([
 supabase.from("visitors").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("status", "entered"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("status", "exited"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("status", "pending"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("status", "revoked"),
 supabase.from("residents").select("id", { count: "exact", head: true }).eq("is_active", true),
 supabase.from("residents").select("id", { count: "exact", head: true }).eq("is_active", false),
 supabase.from("security_personnel").select("id", { count: "exact", head: true }).eq("is_active", true),
 supabase.from("security_personnel").select("id", { count: "exact", head: true }).eq("is_active", false),
 supabase.from("visitors").select("id, visitor_name, resident_name, status, created_at").order("created_at", { ascending: false }).limit(6),
 supabase.auth.getUser(),
 ]);

 const failedRequest = [
 visitorsToday.error,
 currentlyInside.error,
 checkedOut.error,
 pendingPasses.error,
 revokedPasses.error,
 activeResidents.error,
 inactiveResidents.error,
 activeSecurity.error,
 inactiveSecurity.error,
 recentVisitors.error,
 ].find(Boolean);

 if (failedRequest) {
 toast.error("Unable to load the admin dashboard.");
 setLoading(false);
 return;
 }

 if (authUser.data.user) {
 const { data: profile } = await supabase.from("profiles").select("role").eq("id", authUser.data.user.id).single();
 setIsSuperAdmin(profile?.role === "super_admin");
 }

 setOverview({
 access: {
 visitorsToday: visitorsToday.count ?? 0,
 currentlyInside: currentlyInside.count ?? 0,
 checkedOut: checkedOut.count ?? 0,
 pendingPasses: pendingPasses.count ?? 0,
 revokedPasses: revokedPasses.count ?? 0,
 },
 estateAccounts: {
 activeResidents: activeResidents.count ?? 0,
 inactiveResidents: inactiveResidents.count ?? 0,
 activeSecurity: activeSecurity.count ?? 0,
 inactiveSecurity: inactiveSecurity.count ?? 0,
 },
 recentVisitors: recentVisitors.data ?? [],
 });
 setLoading(false);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadOverview(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadOverview]);

 const watchItems = useMemo(() => {
 const items = [];
 if (overview.access.currentlyInside > 0) items.push(`${overview.access.currentlyInside} visitor ${overview.access.currentlyInside === 1 ? "is" : "are"} currently inside.`);
 if (overview.access.pendingPasses > 0) items.push(`${overview.access.pendingPasses} visitor pass ${overview.access.pendingPasses === 1 ? "is" : "are"} still pending.`);
 if (overview.access.revokedPasses > 0) items.push(`${overview.access.revokedPasses} revoked pass ${overview.access.revokedPasses === 1 ? "needs" : "need"} visibility today.`);
 if (overview.estateAccounts.inactiveSecurity > 0) items.push(`${overview.estateAccounts.inactiveSecurity} security account ${overview.estateAccounts.inactiveSecurity === 1 ? "is" : "are"} inactive.`);
 return items;
 }, [overview]);

 return (
 <AppShell size="wide">
 <div className="space-y-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <PageHeader title="Admin Dashboard" subtitle="Daily estate operations, visitor access, residents, and security teams." />
 <div className="flex flex-col gap-3 sm:flex-row">
 {isSuperAdmin && (
 <Link href="/admin/super-admin" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-ring">
 <UserCog className="h-5 w-5" />
 Super Admin
 </Link>
 )}
 <Link href="/admin/currently-inside" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring">
 <DoorOpen className="h-5 w-5" />
 View Live Access
 </Link>
 </div>
 </div>

 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <StatCard label="Visitors Today" value={loading ? "..." : overview.access.visitorsToday} icon={<Activity className="h-6 w-6 text-primary" />} />
 <StatCard label="Currently Inside" value={loading ? "..." : overview.access.currentlyInside} icon={<DoorOpen className="h-6 w-6 text-primary" />} />
 <StatCard label="Checked Out" value={loading ? "..." : overview.access.checkedOut} icon={<Clock3 className="h-6 w-6 text-primary" />} />
 <StatCard label="Revoked Passes" value={loading ? "..." : overview.access.revokedPasses} icon={<AlertTriangle className="h-6 w-6 text-destructive" />} />
 </section>

 <section className="grid gap-6 xl:grid-cols-2">
 <MetricBarChart
 title="Visitor access snapshot"
 description="A live comparison of today’s visitor flow and access states."
 loading={loading}
 data={[
 { label: "Created today", value: overview.access.visitorsToday },
 { label: "Currently inside", value: overview.access.currentlyInside },
 { label: "Checked out", value: overview.access.checkedOut },
 { label: "Pending", value: overview.access.pendingPasses },
 { label: "Revoked", value: overview.access.revokedPasses },
 ]}
 />
 <AccountStatusChart
 title="Estate account health"
 description="Active and inactive resident and security accounts."
 loading={loading}
 data={[
 {
 label: "Residents",
 active: overview.estateAccounts.activeResidents,
 inactive: overview.estateAccounts.inactiveResidents,
 },
 {
 label: "Security",
 active: overview.estateAccounts.activeSecurity,
 inactive: overview.estateAccounts.inactiveSecurity,
 },
 ]}
 />
 </section>

 <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center gap-3">
 <Home className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Estate operations summary</h2>
 </div>
 </div>
 <div className="grid gap-0 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
 <div className="p-6">
 <p className="text-sm font-medium text-muted-foreground">Residents</p>
 <p className="mt-3 text-3xl font-bold">{overview.estateAccounts.activeResidents}</p>
 <p className="mt-2 text-sm text-muted-foreground">{overview.estateAccounts.inactiveResidents} inactive</p>
 </div>
 <div className="p-6">
 <p className="text-sm font-medium text-muted-foreground">Security personnel</p>
 <p className="mt-3 text-3xl font-bold">{overview.estateAccounts.activeSecurity}</p>
 <p className="mt-2 text-sm text-muted-foreground">{overview.estateAccounts.inactiveSecurity} inactive</p>
 </div>
 <div className="p-6">
 <p className="text-sm font-medium text-muted-foreground">Visitor queue</p>
 <p className="mt-3 text-3xl font-bold">{overview.access.pendingPasses}</p>
 <p className="mt-2 text-sm text-muted-foreground">{overview.access.currentlyInside} inside right now</p>
 </div>
 </div>
 </Card>

 <Card className={watchItems.length > 0 ? "border-amber-300 bg-amber-50/70" : "border-emerald-300 bg-emerald-50/70"}>
 <div className="flex items-center gap-3">
 {watchItems.length > 0 ? <AlertTriangle className="h-6 w-6 text-amber-600" /> : <ShieldCheck className="h-6 w-6 text-emerald-700" />}
 <div>
 <h2 className="font-bold text-foreground">Operations watch</h2>
 <p className="mt-1 text-sm text-muted-foreground">{watchItems.length > 0 ? "Items worth checking before the next shift." : "No urgent estate operations warnings right now."}</p>
 </div>
 </div>
 <div className="mt-5 space-y-3">
 {watchItems.length === 0 ? (
 <p className="text-sm text-muted-foreground">Visitor access, resident records, and security staffing look steady.</p>
 ) : (
 watchItems.map((item) => <p key={item} className="rounded-2xl bg-background/70 p-3 text-sm text-foreground">{item}</p>)
 )}
 </div>
 </Card>
 </section>

 <section className="grid gap-4 md:grid-cols-2">
 {createActions.map((action) => {
 const Icon = action.icon;
 return (
 <Link key={action.href} href={action.href} className="rounded-3xl border border-primary/30 bg-card p-5 shadow-sm shadow-muted/50 transition hover:border-primary/60 hover:bg-primary/10">
 <div className="flex items-center justify-between gap-4">
 <div>
 <Icon className="h-6 w-6 text-primary" />
 <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Create account</p>
 <h3 className="mt-2 text-lg font-bold">{action.label}</h3>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
 </div>
 <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
 <Plus className="h-5 w-5" />
 </span>
 </div>
 </Link>
 );
 })}
 </section>

 {actionGroups.map((group) => (
 <section key={group.title} aria-labelledby={`group-${group.title.replaceAll(" ", "-").toLowerCase()}`}>
 <div className="mb-4">
 <h2 id={`group-${group.title.replaceAll(" ", "-").toLowerCase()}`} className="text-lg font-bold">
 {group.title}
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
 </div>
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 {group.actions.map((action) => {
 const Icon = action.icon;
 return (
 <Link key={action.href} href={action.href} className="group rounded-3xl border border-border bg-card p-5 shadow-sm shadow-muted/50 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:shadow-md">
 <div className="flex items-start justify-between gap-4">
 <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
 <Icon className="h-6 w-6" />
 </span>
 <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
 </div>
 <h3 className="mt-4 font-bold">{action.label}</h3>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
 </Link>
 );
 })}
 </div>
 </section>
 ))}

 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center gap-3">
 <ClipboardList className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Recent visitor movement</h2>
 </div>
 </div>
 {overview.recentVisitors.length === 0 ? (
 <p className="p-6 text-sm text-muted-foreground">No recent visitor activity yet.</p>
 ) : (
 <div className="divide-y divide-border">
 {overview.recentVisitors.map((visitor) => (
 <article key={visitor.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="font-semibold">{visitor.visitor_name}</p>
 <p className="mt-1 text-sm text-muted-foreground">Visiting {visitor.resident_name} · {formatDate(visitor.created_at)}</p>
 </div>
 <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${visitorStatusClassName(visitor.status)}`}>{displayVisitorStatus(visitor.status)}</span>
 </article>
 ))}
 </div>
 )}
 </Card>
 </div>
 </AppShell>
 );
}
