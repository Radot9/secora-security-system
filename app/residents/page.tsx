"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 Activity,
 AlertTriangle,
 Clock3,
 DoorOpen,
 Home,
 QrCode,
 ShieldCheck,
 UserPlus,
 UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { ResidentBottomNav } from "../components/ResidentBottomNav";
import { AppShell } from "../components/ui/AppShell";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";
import { displayVisitorStatus, visitorStatusClassName } from "@/lib/visitor-status";
import { formatResidentAddress, formatResidentLocation } from "@/lib/resident-address";

type ResidentProfile = {
 id: string;
 full_name: string;
 house_number: string;
 street: string | null;
 close: string | null;
};

type ResidentOverview = {
 totalVisitors: number;
 pendingPasses: number;
 currentlyInside: number;
 revokedPasses: number;
 recentVisitors: Visitor[];
};

const fallbackOverview: ResidentOverview = {
 totalVisitors: 0,
 pendingPasses: 0,
 currentlyInside: 0,
 revokedPasses: 0,
 recentVisitors: [],
};

const quickActions = [
 {
 title: "Add Visitor",
 href: "/residents/generate-code",
 description: "Create a pass and share it with an expected visitor.",
 icon: UserPlus,
 },
 {
 title: "Latest Access Code",
 href: "/residents/access-code",
 description: "Open your most recently generated visitor pass.",
 icon: QrCode,
 },
 {
 title: "Visitor History",
 href: "/residents/visitors",
 description: "Review every pass you have created for your home.",
 icon: UsersRound,
 },
 {
 title: "Activity",
 href: "/residents/activity",
 description: "Check recent check-ins, exits, and access movement.",
 icon: Activity,
 },
];

function initials(name?: string) {
 if (!name) return "R";
 return name
 .split(" ")
 .map((part) => part[0])
 .join("")
 .slice(0, 2)
 .toUpperCase();
}

function formatTime(value: string | null) {
 if (!value) return "Pending";
 return new Intl.DateTimeFormat(undefined, {
 dateStyle: "medium",
 timeStyle: "short",
 }).format(new Date(value));
}

export default function ResidentsPage() {
 const [resident, setResident] = useState<ResidentProfile | null>(null);
 const [overview, setOverview] = useState<ResidentOverview>(fallbackOverview);
 const [loading, setLoading] = useState(true);

 const loadDashboard = useCallback(async () => {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 setLoading(false);
 return;
 }

 const { data: residentData, error: residentError } = await supabase
 .from("residents")
 .select("id, full_name, house_number, street, close")
 .eq("user_id", user.id)
 .single();

 if (residentError || !residentData) {
 toast.error("Unable to load your resident profile.");
 setLoading(false);
 return;
 }

 const [
 totalVisitors,
 pendingPasses,
 currentlyInside,
 revokedPasses,
 recentVisitors,
 ] = await Promise.all([
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "pending"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "entered"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "revoked"),
 supabase.from("visitors").select("*").eq("resident_id", residentData.id).order("created_at", { ascending: false }).limit(5),
 ]);

 const failedRequest = [
 totalVisitors.error,
 pendingPasses.error,
 currentlyInside.error,
 revokedPasses.error,
 recentVisitors.error,
 ].find(Boolean);

 if (failedRequest) {
 toast.error("Unable to load your visitor dashboard.");
 setLoading(false);
 return;
 }

 setResident(residentData);
 setOverview({
 totalVisitors: totalVisitors.count ?? 0,
 pendingPasses: pendingPasses.count ?? 0,
 currentlyInside: currentlyInside.count ?? 0,
 revokedPasses: revokedPasses.count ?? 0,
 recentVisitors: recentVisitors.data ?? [],
 });
 setLoading(false);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadDashboard(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadDashboard]);

 const watchItems = useMemo(() => {
 const items = [];
 if (overview.currentlyInside > 0) items.push(`${overview.currentlyInside} visitor ${overview.currentlyInside === 1 ? "is" : "are"} currently inside the estate.`);
 if (overview.pendingPasses > 0) items.push(`${overview.pendingPasses} visitor pass ${overview.pendingPasses === 1 ? "is" : "are"} waiting to be used.`);
 if (overview.revokedPasses > 0) items.push(`${overview.revokedPasses} visitor pass ${overview.revokedPasses === 1 ? "has" : "have"} been revoked.`);
 return items;
 }, [overview]);

 const address = resident
 ? formatResidentAddress(resident)
 : "Thomas Ajufo Estate";
 const locationName = resident ? formatResidentLocation(resident) : "Location unavailable";

 const latestCode = overview.recentVisitors.find((visitor) => visitor.access_code)?.access_code;

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-4">
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary shadow-sm shadow-primary/10">
 {initials(resident?.full_name)}
 </div>
 <PageHeader
 title={`Welcome ${resident?.full_name ?? "Resident"}`}
 subtitle={`${address}, Thomas Ajufo Estate`}
 />
 </div>
 <Link
 href="/residents/generate-code"
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <UserPlus className="h-5 w-5" />
 Add Visitor
 </Link>
 </div>

 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <StatCard label="Total Visitors" value={loading ? "..." : overview.totalVisitors} icon={<UsersRound className="h-6 w-6 text-primary" />} />
 <StatCard label="Pending Passes" value={loading ? "..." : overview.pendingPasses} icon={<Clock3 className="h-6 w-6 text-primary" />} />
 <StatCard label="Currently Inside" value={loading ? "..." : overview.currentlyInside} icon={<DoorOpen className="h-6 w-6 text-primary" />} />
 <StatCard label="Revoked Passes" value={loading ? "..." : overview.revokedPasses} icon={<AlertTriangle className="h-6 w-6 text-destructive" />} />
 </section>

 <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center gap-3">
 <Home className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Home access summary</h2>
 </div>
 </div>
 <div className="grid gap-0 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
 <div className="p-6">
 <p className="text-sm font-medium text-muted-foreground">Address</p>
 <p className="mt-3 text-xl font-bold">{resident?.house_number ?? "--"}</p>
 <p className="mt-2 text-sm text-muted-foreground">Location: {locationName}</p>
 </div>
 <div className="p-6">
 <p className="text-sm font-medium text-muted-foreground">Latest access code</p>
 <p className="mt-3 text-xl font-bold tracking-[0.18em]">{latestCode ?? "--"}</p>
 <p className="mt-2 text-sm text-muted-foreground">Use the access code page to copy or share details.</p>
 </div>
 <div className="p-6">
 <p className="text-sm font-medium text-muted-foreground">Pass activity</p>
 <p className="mt-3 text-3xl font-bold">{overview.totalVisitors}</p>
 <p className="mt-2 text-sm text-muted-foreground">passes created from your home</p>
 </div>
 </div>
 </Card>

 <Card className={watchItems.length > 0 ? "border-amber-400 bg-amber-50" : "border-emerald-400 bg-emerald-50"}>
 <div className="flex items-center gap-3">
 {watchItems.length > 0 ? <AlertTriangle className="h-6 w-6 text-amber-800" /> : <ShieldCheck className="h-6 w-6 text-emerald-800" />}
 <div>
 <h2 className={`font-bold ${watchItems.length > 0 ? "text-amber-950" : "text-emerald-950"}`}>Resident watch</h2>
 <p className={`mt-1 text-sm ${watchItems.length > 0 ? "text-amber-900" : "text-emerald-900"}`}>
 {watchItems.length > 0 ? "Visitor activity worth checking." : "Your visitor access looks quiet right now."}
 </p>
 </div>
 </div>
 <div className="mt-5 space-y-3">
 {watchItems.length === 0 ? (
 <p className="text-sm font-medium text-emerald-950">No pending or active visitor issues for your home.</p>
 ) : (
 watchItems.map((item) => <p key={item} className="rounded-2xl border border-amber-200 bg-white p-3 text-sm font-medium text-amber-950">{item}</p>)
 )}
 </div>
 </Card>
 </section>

 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 {quickActions.map((action) => {
 const Icon = action.icon;
 const href = action.href === "/residents/access-code" && latestCode ? `${action.href}?code=${latestCode}` : action.href;
 return (
 <Link key={action.title} href={href} className="rounded-3xl border border-border bg-card p-5 shadow-sm shadow-muted/50 transition hover:border-primary/40 hover:bg-primary/10">
 <Icon className="h-6 w-6 text-primary" />
 <h3 className="mt-4 font-bold">{action.title}</h3>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
 </Link>
 );
 })}
 </section>

 <Card className="p-0">
 <div className="flex items-center justify-between gap-4 border-b border-border p-6">
 <div className="flex items-center gap-3">
 <Activity className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Recent visitors</h2>
 </div>
 <Link href="/residents/visitors" className="text-sm font-semibold text-primary transition hover:text-primary/80">
 View all
 </Link>
 </div>
 {loading ? (
 <p className="p-6 text-sm text-muted-foreground">Loading visitors...</p>
 ) : overview.recentVisitors.length === 0 ? (
 <p className="p-6 text-sm text-muted-foreground">No visitors created yet.</p>
 ) : (
 <div className="divide-y divide-border">
 {overview.recentVisitors.map((visitor) => (
 <article key={visitor.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="font-semibold">{visitor.visitor_name}</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {visitor.visitor_phone} · {formatTime(visitor.created_at)}
 </p>
 </div>
 <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${visitorStatusClassName(visitor.status)}`}>
 {displayVisitorStatus(visitor.status)}
 </span>
 </article>
 ))}
 </div>
 )}
 </Card>
 </div>
 <ResidentBottomNav />
 </AppShell>
 );
}
