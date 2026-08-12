"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 Activity,
 AlertTriangle,
 Bell,
 Clock3,
 DoorOpen,
 Home,
 MessageCircle,
 PhoneCall,
 QrCode,
 ShieldCheck,
 TicketPlus,
 UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/ui/AppShell";
import { Card } from "../components/ui/Card";
import { DashboardLoadingNotice } from "../components/ui/DashboardLoading";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";
import { displayVisitorStatus, visitorStatusClassName } from "@/lib/visitor-status";
import { formatResidentAddress, formatResidentLocation } from "@/lib/resident-address";
import type { Announcement } from "@/types/community";

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
 expiredPasses: number;
 recentVisitors: Visitor[];
};

const fallbackOverview: ResidentOverview = {
 totalVisitors: 0,
 pendingPasses: 0,
 currentlyInside: 0,
 revokedPasses: 0,
 expiredPasses: 0,
 recentVisitors: [],
};

const quickActions = [
 {
 title: "Generate Pass",
 href: "/residents/generate-code",
 description: "Create a pass and share it with an expected visitor.",
 icon: TicketPlus,
 },
 {
 title: "Latest Access Code",
 href: "/residents/access-code",
 description: "Open your most recently generated visitor pass.",
 icon: QrCode,
 },
 {
 title: "My Passes",
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
 const [announcements, setAnnouncements] = useState<Announcement[]>([]);
 const [loading, setLoading] = useState(true);

 const loadDashboard = useCallback(async () => {
 const nowIso = new Date().toISOString();
 const {
 data: { session },
 } = await supabase.auth.getSession();
 const user = session?.user;

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
 expiredPasses,
 recentVisitors,
 latestAnnouncements,
 ] = await Promise.all([
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "pending").gt("expires_at", nowIso),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "entered"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "revoked"),
 supabase.from("visitors").select("id", { count: "exact", head: true }).eq("resident_id", residentData.id).eq("status", "pending").lte("expires_at", nowIso),
 supabase.from("visitors").select("*").eq("resident_id", residentData.id).order("created_at", { ascending: false }).limit(5),
 supabase.from("announcements").select("id, title, body, category, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(1),
 ]);

 const failedRequest = [
 totalVisitors.error,
 pendingPasses.error,
 currentlyInside.error,
 revokedPasses.error,
 expiredPasses.error,
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
 expiredPasses: expiredPasses.count ?? 0,
 recentVisitors: recentVisitors.data ?? [],
 });
 setAnnouncements((latestAnnouncements.data as Announcement[] | null) ?? []);
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
 const latestAnnouncement = announcements[0];

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-4">
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary shadow-sm shadow-primary/10">
 {initials(resident?.full_name)}
 </div>
 <PageHeader
 title={`Welcome home, ${resident?.full_name?.split(" ")[0] ?? "Resident"}`}
 subtitle={`${address}, Thomas Ajufo Estate`}
 />
 </div>
 <Link
 href="/residents/generate-code"
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <TicketPlus className="h-5 w-5" />
 Generate Pass
 </Link>
 </div>

 {loading && <DashboardLoadingNotice label="Loading your home and visitor activity…" />}

 <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
 <Link href="/residents/generate-code" data-interactive="true" className="resident-pass-card apple-card group relative min-h-64 overflow-hidden rounded-3xl border border-primary/25 p-7 text-white sm:p-8">
 <div className="relative z-10 max-w-md">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Visitor access</p>
 <h2 className="mt-4 text-3xl font-bold tracking-tight">Generate a visitor pass</h2>
 <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">Invite family, friends, and service providers with a secure, time-limited access code.</p>
 <span className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-lg transition group-hover:bg-amber-300"><TicketPlus className="h-5 w-5" />Create pass</span>
 </div>
 <div className="resident-pass-card__ticket" aria-hidden="true"><QrCode className="h-16 w-16" /><span className="mt-3 text-xs font-black tracking-[0.22em]">ENTRISEQ</span></div>
 </Link>

 <Card className="resident-status-card flex min-h-64 flex-col justify-between overflow-hidden border-primary/25">
 <div className="flex items-start justify-between gap-5">
 <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Home status</p><h2 className="mt-3 text-2xl font-bold">{watchItems.length === 0 ? "You’re all set!" : "Needs your attention"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{watchItems.length === 0 ? "No pending visitor issues or approvals." : `${watchItems.length} visitor access ${watchItems.length === 1 ? "item needs" : "items need"} a quick review.`}</p></div>
 <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary/15 text-primary"><ShieldCheck className="h-9 w-9" /></span>
 </div>
 <Link href="/residents/visitors" className="mt-6 text-sm font-bold text-primary">Review my passes →</Link>
 </Card>
 </section>

 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
 <StatCard href="/residents/visitors?status=all" label="Total Visitors" value={loading ? "..." : overview.totalVisitors} icon={<UsersRound className="h-6 w-6 text-primary" />} />
 <StatCard href="/residents/visitors?status=pending" label="Pending Passes" value={loading ? "..." : overview.pendingPasses} icon={<Clock3 className="h-6 w-6 text-primary" />} />
 <StatCard href="/residents/visitors?status=entered" ariaLabel="View passes for visitors currently inside" label="Currently Inside" value={loading ? "..." : overview.currentlyInside} icon={<DoorOpen className="h-6 w-6 text-primary" />} />
 <StatCard href="/residents/visitors?status=revoked" label="Revoked Passes" value={loading ? "..." : overview.revokedPasses} icon={<AlertTriangle className="h-6 w-6 text-destructive" />} />
 <StatCard href="/residents/visitors?status=expired" label="Expired Codes" value={loading ? "..." : overview.expiredPasses} icon={<Clock3 className="h-6 w-6 text-destructive" />} />
 </section>

 <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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

 <Card className="resident-watch-card resident-watch-card--clear">
 <div className="flex items-center gap-3">
 <MessageCircle className="h-6 w-6 text-primary" />
 <div>
 <h2 className="font-bold text-foreground">WhatsApp passes</h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Passes generated from WhatsApp will appear here.
 </p>
 </div>
 </div>
 <div className="mt-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
 <p className="text-sm font-semibold text-foreground">Coming soon</p>
 <p className="mt-1 text-sm leading-6 text-muted-foreground">This card is reserved for the upcoming WhatsApp pass-generation integration.</p>
 </div>
 </Card>
 </section>

 <section className="grid gap-6 xl:grid-cols-2">
 <Card className="p-0">
 <div className="flex items-center justify-between border-b border-border p-6">
 <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-amber-500" /><h2 className="text-lg font-bold">Announcements</h2></div>
 <Link href="/residents/announcements" className="text-sm font-bold text-primary">View all</Link>
 </div>
 {latestAnnouncement ? (
 <div className="p-6"><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold capitalize text-amber-600">{latestAnnouncement.category}</span><h3 className="mt-4 text-xl font-bold">{latestAnnouncement.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{latestAnnouncement.body}</p><p className="mt-4 text-xs text-muted-foreground">{formatTime(latestAnnouncement.published_at)}</p></div>
 ) : (
 <div className="p-6"><h3 className="font-bold">No new announcements</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Estate updates and important notices will appear here.</p></div>
 )}
 </Card>

 <Card className="p-0">
 <div className="flex items-center justify-between border-b border-border p-6">
 <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold">Community</h2></div>
 <Link href="/residents/community" className="text-sm font-bold text-primary">Open forum</Link>
 </div>
 <div className="p-6"><h3 className="text-xl font-bold">Join the conversation</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask neighbours a question, share recommendations, or find an existing topic with community search.</p><Link href="/residents/community" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-bold text-primary"><MessageCircle className="h-4 w-4" />Browse discussions</Link></div>
 </Card>
 </section>

 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 {quickActions.map((action) => {
 const Icon = action.icon;
 const href = action.href === "/residents/access-code" && latestCode ? `${action.href}?code=${latestCode}` : action.href;
 return (
 <Link key={action.title} href={href} data-interactive="true" className="apple-card rounded-3xl border border-border bg-card p-5">
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

 <section className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><PhoneCall className="h-6 w-6" /></span><div><h2 className="font-bold">Your safety is our priority.</h2><p className="mt-1 text-sm text-muted-foreground">Call estate security immediately if you see something suspicious.</p></div></div>
 <a href="tel:07045739437" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"><PhoneCall className="h-4 w-4" />Contact Security</a>
 </section>
 </div>
 </AppShell>
 );
}
