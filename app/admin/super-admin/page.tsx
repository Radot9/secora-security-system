"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 Activity,
 AlertTriangle,
 BarChart3,
 ClipboardList,
 Clock3,
 DoorOpen,
 ShieldCheck,
 UserCog,
 UserPlus,
 UsersRound,
 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatCard } from "@/app/components/ui/StatCard";

type PendingInvitation = {
 id: string;
 email: string;
 full_name: string | null;
 intended_role: "admin" | "super_admin";
 status: "pending" | "accepted" | "revoked" | "expired";
 expires_at: string;
 created_at: string;
};

type AuditLog = {
 id: string;
 target_email: string | null;
 action: string;
 metadata: Record<string, unknown>;
 created_at: string;
};

type SuperAdminOverview = {
 administrators: {
 total: number;
 activeSuperAdmins: number;
 activeAdmins: number;
 inactive: number;
 incompleteOnboarding: number;
 pendingInvitations: number;
 };
 estateAccounts: {
 activeResidents: number;
 inactiveResidents: number;
 activeSecurity: number;
 inactiveSecurity: number;
 };
 access: {
 visitorsToday: number;
 currentlyInside: number;
 revokedPasses: number;
 pendingPasses: number;
 };
 pendingInvitations: PendingInvitation[];
 recentAuditLogs: AuditLog[];
};

const fallbackOverview: SuperAdminOverview = {
 administrators: {
 total: 0,
 activeSuperAdmins: 0,
 activeAdmins: 0,
 inactive: 0,
 incompleteOnboarding: 0,
 pendingInvitations: 0,
 },
 estateAccounts: {
 activeResidents: 0,
 inactiveResidents: 0,
 activeSecurity: 0,
 inactiveSecurity: 0,
 },
 access: {
 visitorsToday: 0,
 currentlyInside: 0,
 revokedPasses: 0,
 pendingPasses: 0,
 },
 pendingInvitations: [],
 recentAuditLogs: [],
};

const quickActions = [
 {
 label: "Invite administrators",
 href: "/admin/administrators",
 description: "Create, promote, deactivate, resend, and revoke privileged accounts.",
 icon: UserPlus,
 },
 {
 label: "Review access trends",
 href: "/admin/analytics",
 description: "Check visitor volume, active passes, and estate access behavior.",
 icon: BarChart3,
 },
 {
 label: "Manage residents",
 href: "/admin/residents",
 description: "Review resident accounts and estate home records.",
 icon: UsersRound,
 },
 {
 label: "Manage security",
 href: "/admin/security",
 description: "Review gate personnel, teams, and account status.",
 icon: ShieldCheck,
 },
];

function formatAction(action: string) {
 return action
 .split("_")
 .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
 .join(" ");
}

function formatDate(value: string) {
 return new Intl.DateTimeFormat(undefined, {
 dateStyle: "medium",
 timeStyle: "short",
 }).format(new Date(value));
}

export default function SuperAdminDashboardPage() {
 const [overview, setOverview] = useState<SuperAdminOverview>(fallbackOverview);
 const [loading, setLoading] = useState(true);

 const loadOverview = useCallback(async () => {
 const response = await fetch("/api/admin/super-admin/overview", { cache: "no-store" });
 const result = await response.json();

 if (!response.ok) {
 toast.error(result.error ?? "Unable to load Super Admin dashboard.");
 setLoading(false);
 return;
 }

 setOverview(result.overview);
 setLoading(false);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadOverview(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadOverview]);

 const riskItems = useMemo(() => {
 const items = [];

 if (overview.administrators.activeSuperAdmins <= 1) {
 items.push("Only one active Super Admin exists. Add a backup Super Admin when the estate is ready.");
 }

 if (overview.administrators.pendingInvitations > 0) {
 items.push(`${overview.administrators.pendingInvitations} administrator invitation needs follow-up.`);
 }

 if (overview.administrators.inactive > 0) {
 items.push(`${overview.administrators.inactive} privileged account is inactive and retained for audit history.`);
 }

 if (overview.administrators.incompleteOnboarding > 0) {
 items.push(`${overview.administrators.incompleteOnboarding} administrator account has not completed onboarding.`);
 }

 return items;
 }, [overview]);

 return (
 <AppShell size="wide">
 <div className="space-y-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <PageHeader
 title="Super Admin Dashboard"
 subtitle="Privileged access, administrator onboarding, and estate account health."
 />
 <Link
 href="/admin/administrators"
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <UserCog className="h-5 w-5" />
 Manage Administrators
 </Link>
 </div>

 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <StatCard
 label="Active Super Admins"
 value={loading ? "..." : overview.administrators.activeSuperAdmins}
 icon={<ShieldCheck className="h-6 w-6 text-primary" />}
 />
 <StatCard
 label="Active Admins"
 value={loading ? "..." : overview.administrators.activeAdmins}
 icon={<UserCog className="h-6 w-6 text-primary" />}
 />
 <StatCard
 label="Pending Invitations"
 value={loading ? "..." : overview.administrators.pendingInvitations}
 icon={<Clock3 className="h-6 w-6 text-primary" />}
 />
 <StatCard
 label="Currently Inside"
 value={loading ? "..." : overview.access.currentlyInside}
 icon={<DoorOpen className="h-6 w-6 text-primary" />}
 />
 </section>

 <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center gap-3">
 <Activity className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Estate control summary</h2>
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
 <p className="text-sm font-medium text-muted-foreground">Visitor passes today</p>
 <p className="mt-3 text-3xl font-bold">{overview.access.visitorsToday}</p>
 <p className="mt-2 text-sm text-muted-foreground">{overview.access.pendingPasses} pending, {overview.access.revokedPasses} revoked</p>
 </div>
 </div>
 </Card>

 <Card className={riskItems.length > 0 ? "border-amber-300 bg-amber-50/70" : "border-emerald-300 bg-emerald-50/70"}>
 <div className="flex items-center gap-3">
 {riskItems.length > 0 ? <AlertTriangle className="h-6 w-6 text-amber-600" /> : <ShieldCheck className="h-6 w-6 text-emerald-700" />}
 <div>
 <h2 className="font-bold text-foreground">Governance watch</h2>
 <p className="mt-1 text-sm text-muted-foreground">
 {riskItems.length > 0 ? "Items worth checking before launch." : "No privileged-access warnings right now."}
 </p>
 </div>
 </div>
 <div className="mt-5 space-y-3">
 {riskItems.length === 0 ? (
 <p className="text-sm text-muted-foreground">Administrator access, onboarding, and status checks look clean.</p>
 ) : (
 riskItems.map((item) => (
 <p key={item} className="rounded-2xl bg-background/70 p-3 text-sm text-foreground">
 {item}
 </p>
 ))
 )}
 </div>
 </Card>
 </section>

 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 {quickActions.map((action) => {
 const Icon = action.icon;
 return (
 <Link
 key={action.href}
 href={action.href}
 className="rounded-3xl border border-border bg-card p-5 shadow-sm shadow-muted/50 transition hover:border-primary/40 hover:bg-primary/10"
 >
 <Icon className="h-6 w-6 text-primary" />
 <h3 className="mt-4 font-bold">{action.label}</h3>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
 </Link>
 );
 })}
 </section>

 <section className="grid gap-6 xl:grid-cols-2">
 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center gap-3">
 <Clock3 className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Pending administrator invitations</h2>
 </div>
 </div>
 {overview.pendingInvitations.length === 0 ? (
 <p className="p-6 text-sm text-muted-foreground">No pending administrator invitations.</p>
 ) : (
 <div className="divide-y divide-border">
 {overview.pendingInvitations.map((invitation) => (
 <article key={invitation.id} className="p-6">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="font-semibold">{invitation.full_name ?? "Profile not completed"}</p>
 <p className="mt-1 text-sm text-muted-foreground">{invitation.email}</p>
 </div>
 <span className="w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
 {invitation.intended_role === "super_admin" ? "Super Admin" : "Admin"}
 </span>
 </div>
 <p className="mt-3 text-sm text-muted-foreground">Expires {formatDate(invitation.expires_at)}</p>
 </article>
 ))}
 </div>
 )}
 </Card>

 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center gap-3">
 <ClipboardList className="h-5 w-5 text-primary" />
 <h2 className="text-lg font-bold">Recent privileged activity</h2>
 </div>
 </div>
 {overview.recentAuditLogs.length === 0 ? (
 <p className="p-6 text-sm text-muted-foreground">No privileged activity recorded yet.</p>
 ) : (
 <div className="divide-y divide-border">
 {overview.recentAuditLogs.map((log) => (
 <article key={log.id} className="p-6">
 <p className="font-semibold">{formatAction(log.action)}</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {log.target_email ?? "No target email"} · {formatDate(log.created_at)}
 </p>
 </article>
 ))}
 </div>
 )}
 </Card>
 </section>
 </div>
 </AppShell>
 );
}
