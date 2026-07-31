"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import {
 Activity,
 CheckCircle2,
 Clock3,
 DoorOpen,
 IdCard,
 MapPin,
 Menu,
 QrCode,
 ShieldCheck,
 ShieldX,
 LogOut,
 UserCircle,
 UsersRound,
} from "lucide-react";

import ScannerModal from "./components/ScannerModal";
import ActivityTable from "./components/ActivityTable";
import VerificationCard from "./components/VerificationCard";
import VisitorDetailsModal from "./components/VisitorDetailsModal";
import { ActivityItem } from "@/types/activity";
import { toast } from "sonner";
import { getDisplayVisitorStatus } from "@/lib/visitor-status";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

type SecurityOfficerProfile = {
 full_name: string | null;
 email: string | null;
 gate: string | null;
 team: string | null;
};

type SecurityStat = {
 label: string;
 value: string;
 tone: "default" | "danger";
 icon: typeof UsersRound;
};

function initials(name?: string | null) {
 if (!name) return "SO";

 return name
 .split(" ")
 .filter(Boolean)
 .map((part) => part[0])
 .join("")
 .slice(0, 2)
 .toUpperCase();
}

function dutyValue(value?: string | null) {
 return value?.trim() || "Not assigned";
}

function VerificationResultCard({
 visitorName,
 visitorPhone,
 plateNumber,
 status,
 isExpired,
 allowEntry,
 checkOutVisitor,
 close,
 loading,
}: {
 visitorName: string;
 visitorPhone: string;
 plateNumber: string;
 status: string;
 isExpired: boolean;
 allowEntry: () => void;
 checkOutVisitor: () => void;
 close: () => void;
 loading: boolean;
}) {
 if (!visitorName) return null;
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={close}>
 <section role="dialog" aria-modal="true" aria-labelledby="verification-result-title" className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
 <div className="flex items-center gap-3">
 <CheckCircle2 className="h-5 w-5 text-primary" />
 <div>
 <h2 id="verification-result-title" className="text-xl font-bold">Verification Result</h2>
 <p className="mt-1 text-sm text-muted-foreground">Visitor status appears immediately after verification.</p>
 </div>
 </div>

 <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
 <p className="text-sm text-muted-foreground">Visitor Found</p>
 <h3 className="mt-2 text-2xl font-bold">{visitorName}</h3>
 <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
 <p>Phone: {visitorPhone}</p>
 <p>Plate Number: {plateNumber || "N/A"}</p>
 </div>

 {status === "entered" ? (
 <>
 <p className="mt-4 font-semibold text-primary">
 {isExpired ? "Visitor is inside · original pass has expired" : "Visitor already inside"}
 </p>
 <button
 type="button"
 onClick={checkOutVisitor}
 disabled={loading}
 className="mt-4 w-full rounded-2xl bg-foreground px-4 py-3 font-bold text-background shadow-sm transition hover:bg-foreground/85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
 >
 {loading && <LoadingSpinner />} {loading ? "Checking out..." : "Check Out Visitor"}
 </button>
 </>
 ) : isExpired ? (
 <p className="mt-4 font-semibold text-destructive">Pass expired</p>
 ) : status === "revoked" ? (
 <p className="mt-4 font-semibold text-destructive">Access revoked</p>
 ) : status === "pending" ? (
 <>
 <p className="mt-4 font-semibold text-primary">Valid access code</p>
 <button
 type="button"
 onClick={allowEntry}
 disabled={loading}
 className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 {loading && <LoadingSpinner />} {loading ? "Checking in..." : "Check In Visitor"}
 </button>
 </>
 ) : (
 <p className="mt-4 font-semibold text-muted-foreground">Visitor has left</p>
 )}
 </div>
 <button type="button" onClick={close} disabled={loading} className="mt-4 w-full rounded-2xl border border-border px-4 py-3 font-semibold transition hover:bg-muted disabled:opacity-50">Close</button>
 </section>
 </div>
 );
}

function SecurityContent() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const qrCode = searchParams.get("code") ?? "";
 const [accessCode, setAccessCode] = useState(qrCode);
 const [visitorName, setVisitorName] = useState("");
 const [visitorPhone, setVisitorPhone] = useState("");
 const [plateNumber, setPlateNumber] = useState("");
 const [visitorId, setVisitorId] = useState("");
 const [status, setStatus] = useState("");
 const [isExpired, setIsExpired] = useState(false);
 const [scannerOpen, setScannerOpen] = useState(false);
 const [officer, setOfficer] = useState<SecurityOfficerProfile | null>(null);
 const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
 const [transitionLoading, setTransitionLoading] = useState(false);
 const [verificationLoading, setVerificationLoading] = useState(false);
 const autoVerifiedCode = useRef("");
 const [selectedVisitor, setSelectedVisitor] = useState<ActivityItem | null>(
 null,
 );

 const statusConfig = {
 entered: {
 title: "Valid Pass",
 message: "Visitor is authorised",
 color: "text-primary",
 icon: CheckCircle2,
 },

 pending: {
 title: "Pending Entry",
 message: "Visitor has not entered yet",
 color: "text-accent-foreground",
 icon: Clock3,
 },

 exited: {
 title: "Visitor Checked Out",
 message: "Visitor has left the estate",
 color: "text-muted-foreground",
 icon: LogOut,
 },

 expired: {
 title: "Pass Expired",
 message: "Visitor pass is no longer valid",
 color: "text-secondary-foreground",
 icon: Clock3,
 },

 revoked: {
 title: "Access Revoked",
 message: "Visitor access has been cancelled",
 color: "text-destructive",
 icon: ShieldX,
 },
 };
 const [activity, setActivity] = useState<ActivityItem[]>([]);

 const [stats, setStats] = useState<SecurityStat[]>([
 {
 label: "Visitors checked in",
 value: "0",
 tone: "default",
 icon: UsersRound,
 },
 {
 label: "Visitors checked out",
 value: "0",
 tone: "default",
 icon: LogOut,
 },
 {
 label: "Currently inside",
 value: "0",
 tone: "default",
 icon: DoorOpen,
 },
 {
 label: "Expired passes",
 value: "0",
 tone: "danger",
 icon: ShieldX,
 },
 ]);

 const verifyCode = useCallback(
 async (codeToVerify = accessCode) => {
 const code = String(codeToVerify ?? "").trim();

 if (!code) {
 toast.error("Please enter an access code.");
 return;
 }

 setVerificationLoading(true);
 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("access_code", code)
 .maybeSingle();

 if (error) {
 setVerificationLoading(false);
 toast.error(error.message);
 return;
 }

 if (!data) {
 setVerificationLoading(false);
 toast.error(`Code "${code}" was not found.`);
 return;
 }

 setVisitorName(data.visitor_name);
 setVisitorPhone(data.visitor_phone);
 setPlateNumber(data.plate_number);
 setVisitorId(data.id);
 setStatus(data.status);
 setIsExpired(
 data.expires_at ? new Date(data.expires_at) < new Date() : false,
 );
 setVerificationLoading(false);
 },
 [accessCode],
 );

 useEffect(() => {
 let isMounted = true;

 async function loadDashboardData() {
 const now = new Date();
 const startOfToday = new Date(now);
 startOfToday.setHours(0, 0, 0, 0);
 const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
 const nowIso = now.toISOString();
 const startOfTodayIso = startOfToday.toISOString();
 const twentyFourHoursAgoIso = twentyFourHoursAgo.toISOString();

 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (user) {
 const { data: officerData, error: officerError } = await supabase
 .from("security_personnel")
 .select("full_name, email, gate, team")
 .eq("user_id", user.id)
 .maybeSingle();

 if (!officerError && officerData && isMounted) {
 setOfficer(officerData);
 }
 }

 const { count: checkedIn } = await supabase
 .from("visitors")
 .select("*", { count: "exact", head: true })
 .not("entry_time", "is", null)
 .gte("entry_time", startOfTodayIso);

 const { count: checkedOut } = await supabase
 .from("visitors")
 .select("*", { count: "exact", head: true })
 .not("exit_time", "is", null)
 .gte("exit_time", startOfTodayIso);

 const { count: currentlyInside } = await supabase
 .from("visitors")
 .select("*", { count: "exact", head: true })
 .eq("status", "entered");

 const { count: expiredPasses } = await supabase
 .from("visitors")
 .select("*", { count: "exact", head: true })
 .eq("status", "pending")
 .gte("expires_at", startOfTodayIso)
 .lt("expires_at", nowIso);

 const { data: visitors } = await supabase
 .from("visitors")
 .select("id, visitor_name, visitor_phone, plate_number, resident_name, status, created_at, entry_time, exit_time, expires_at, checked_in_by, checked_in_by_name, checked_out_by, checked_out_by_name")
 .in("status", ["entered", "exited"])
 .or(`entry_time.gte.${twentyFourHoursAgoIso},exit_time.gte.${twentyFourHoursAgoIso}`);

 if (!isMounted) return;

 const recentVisitors = (visitors || [])
 .sort((first, second) => {
 const firstTime = Math.max(
 new Date(first.exit_time || 0).getTime(),
 new Date(first.entry_time || 0).getTime(),
 );
 const secondTime = Math.max(
 new Date(second.exit_time || 0).getTime(),
 new Date(second.entry_time || 0).getTime(),
 );

 return secondTime - firstTime;
 })
 .slice(0, 10);

 setActivity(recentVisitors.map((visitor) => ({ ...visitor, access_code: "" })));
 setStats([
 {
 label: "Visitors checked in",
 value: String(checkedIn ?? 0),
 tone: "default",
 icon: UsersRound,
 },
 {
 label: "Visitors checked out",
 value: String(checkedOut ?? 0),
 tone: "default",
 icon: LogOut,
 },
 {
 label: "Currently inside",
 value: String(currentlyInside ?? 0),
 tone: "default",
 icon: DoorOpen,
 },
 {
 label: "Expired passes",
 value: String(expiredPasses ?? 0),
 tone: "danger",
 icon: ShieldX,
 },
 ]);
 }

 void loadDashboardData();

 return () => {
 isMounted = false;
 };
 }, [dashboardRefreshKey]);

 useEffect(() => {
 if (!qrCode || autoVerifiedCode.current === qrCode) return;

 autoVerifiedCode.current = qrCode;
 void verifyCode(qrCode);
 }, [qrCode, verifyCode]);
 async function allowEntry() {
 if (!visitorId) return;
 if (transitionLoading) return;

 setTransitionLoading(true);
 const response = await fetch(`/api/security/visitors/${visitorId}/check-in`, {
 method: "POST",
 });
 const result = await response.json();
 setTransitionLoading(false);

 if (!response.ok) {
 toast.error(result.error ?? "Unable to check in visitor.");
 return;
 }

 setStatus("entered");
 setDashboardRefreshKey((current) => current + 1);
 toast.success("Visitor checked in successfully.");
 }

 async function checkOutVisitor() {
 if (!visitorId) return;
 if (transitionLoading) return;

 setTransitionLoading(true);
 const response = await fetch(`/api/security/visitors/${visitorId}/check-out`, {
 method: "POST",
 });
 const result = await response.json();
 setTransitionLoading(false);

 if (!response.ok) {
 toast.error(result.error ?? "Unable to check out visitor.");
 return;
 }

 setStatus("exited");
 setDashboardRefreshKey((current) => current + 1);

 toast.success("Visitor checked out successfully.");
 }

 const visitorStatusConfig = selectedVisitor
 ? statusConfig[
 getDisplayVisitorStatus({ status: selectedVisitor.status, expiresAt: selectedVisitor.expires_at }) as keyof typeof statusConfig
 ] || statusConfig.pending
 : statusConfig.pending;

 const StatusIcon = visitorStatusConfig.icon;
 const officerName = officer?.full_name ?? "Security Officer";
 const officerInitials = initials(officerName);

 async function handleLogout() {
 const { error } = await supabase.auth.signOut();
 if (error) {
 toast.error("Unable to log out. Please try again.");
 return;
 }

 router.replace("/");
 router.refresh();
 }

 return (
 <main className="min-h-screen bg-background px-4 py-4 text-foreground sm:py-6 lg:px-10 lg:py-10">
 <div className="flex w-full max-w-none flex-col gap-4 sm:gap-6 lg:gap-8">
 <header className="overflow-visible rounded-3xl border border-border bg-card shadow-sm shadow-muted/50 md:overflow-hidden">
 <div className="flex items-center gap-3 p-3 md:hidden">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
 {officerInitials}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
 Security dashboard
 </p>
 <h1 className="truncate text-base font-bold">{officerName}</h1>
 <p className="truncate text-xs text-muted-foreground">
 {dutyValue(officer?.gate)} · {dutyValue(officer?.team)}
 </p>
 </div>

 <details className="group relative ml-auto">
 <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl border border-border bg-background text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-details-marker]:hidden">
 <Menu className="h-5 w-5" />
 <span className="sr-only">Open officer menu</span>
 </summary>
 <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
 <div className="border-b border-border px-2 pb-3">
 <p className="font-semibold">{officerName}</p>
 <p className="mt-1 truncate text-xs text-muted-foreground">
 {officer?.email ?? "No email available"}
 </p>
 </div>
 <div className="grid grid-cols-2 gap-2 py-3 text-sm">
 <div className="rounded-2xl bg-muted p-3">
 <p className="text-xs text-muted-foreground">Gate</p>
 <p className="mt-1 truncate font-semibold">{dutyValue(officer?.gate)}</p>
 </div>
 <div className="rounded-2xl bg-muted p-3">
 <p className="text-xs text-muted-foreground">Team</p>
 <p className="mt-1 truncate font-semibold">{dutyValue(officer?.team)}</p>
 </div>
 </div>
 <div className="grid gap-2">
 <Link
 href="/security/profile"
 className="flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-semibold transition hover:bg-muted"
 >
 <UserCircle className="h-5 w-5 text-primary" />
 View Profile
 </Link>
 <button
 type="button"
 onClick={handleLogout}
 className="flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
 >
 <LogOut className="h-5 w-5" />
 Logout
 </button>
 </div>
 </div>
 </details>
 </div>

 <div className="hidden items-center gap-3 p-3 md:flex lg:px-4">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
 {officerInitials}
 </div>
 <div className="min-w-0">
 <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
 Security dashboard
 </p>
 <h1 className="truncate text-base font-bold">{officerName}</h1>
 </div>

 <div className="ml-auto flex items-center divide-x divide-border">
 <div className="min-w-24 px-4">
 <p className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
 <MapPin className="h-3.5 w-3.5 text-primary" /> Gate
 </p>
 <p className="mt-0.5 max-w-32 truncate text-sm font-semibold">
 {dutyValue(officer?.gate)}
 </p>
 </div>
 <div className="min-w-24 px-4">
 <p className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
 <IdCard className="h-3.5 w-3.5 text-primary" /> Team
 </p>
 <p className="mt-0.5 max-w-32 truncate text-sm font-semibold">
 {dutyValue(officer?.team)}
 </p>
 </div>
 </div>

 <Link
 href="/security/profile"
 aria-label="View profile"
 className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted"
 >
 <UserCircle className="h-5 w-5 text-primary" />
 <span className="hidden xl:inline">Profile</span>
 </Link>
 <button
 type="button"
 onClick={handleLogout}
 aria-label="Logout"
 className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
 >
 <LogOut className="h-5 w-5" />
 <span className="hidden xl:inline">Logout</span>
 </button>
 </div>
 </header>

 <section className="grid items-stretch gap-4 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
 <VerificationCard
 accessCode={accessCode}
 setAccessCode={setAccessCode}
 verifyCode={verifyCode}
 scannerOpen={() => setScannerOpen(true)}
 loading={verificationLoading}
 />

 <div className="flex h-full flex-col gap-4 sm:gap-6">
 <section className="rounded-3xl border border-border bg-card p-4 shadow-sm shadow-muted/50 sm:p-6">
 <div className="flex items-start gap-3 sm:gap-4">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-11 sm:w-11">
 <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
 </div>
 <div className="min-w-0">
 <h2 className="text-lg font-bold sm:text-xl">Duty checklist</h2>
 <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground sm:mt-4 sm:space-y-3 sm:text-sm">
 <p className="flex items-start gap-2"><QrCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Scan or enter each visitor access code.</p>
 <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Confirm visitor details before allowing entry.</p>
 <p className="flex items-start gap-2"><LogOut className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Check visitors out when they leave the estate.</p>
 </div>
 </div>
 </div>
 </section>

 </div>
 </section>

 <section className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-muted/50">
 <div className="flex items-center gap-3">
 <Activity className="h-5 w-5 text-primary" />
 <div>
 <h2 className="text-xl font-bold tracking-tight">Today&apos;s Activity</h2>
 <p className="mt-1 text-sm text-muted-foreground">Counts from today&apos;s gate activity.</p>
 </div>
 </div>
 <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {stats.map((stat) => {
 const Icon = stat.icon;
 const toneClass = stat.tone === "danger"
 ? "bg-destructive/10 text-destructive"
 : "bg-primary/10 text-primary";

 return (
 <article
 key={stat.label}
 className="rounded-2xl border border-border bg-background p-5"
 >
 <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
 <Icon className="h-5 w-5" />
 </div>
 <p className="mt-6 text-2xl font-bold">{stat.value}</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {stat.label}
 </p>
 </article>
 );
 })}
 </div>
 </section>

 <ActivityTable
 activity={activity}
 setSelectedVisitor={setSelectedVisitor}
 getVisitorStatus={(visitor) => getDisplayVisitorStatus({ status: visitor.status, expiresAt: visitor.expires_at })}
 />
 </div>

 <VisitorDetailsModal
 visitor={selectedVisitor}
 visitorStatusConfig={visitorStatusConfig}
 StatusIcon={StatusIcon}
 onClose={() => setSelectedVisitor(null)}
 />
 <VerificationResultCard
 visitorName={visitorName}
 visitorPhone={visitorPhone}
 plateNumber={plateNumber}
 status={status}
 isExpired={isExpired}
 allowEntry={allowEntry}
 checkOutVisitor={checkOutVisitor}
 loading={transitionLoading}
 close={() => {
 setVisitorName("");
 setVisitorId("");
 setStatus("");
 setIsExpired(false);
 }}
 />
 <ScannerModal
 open={scannerOpen}
 onClose={() => setScannerOpen(false)}
 onScan={async (value) => {
 let scannedCode = value;

 // If the QR contains a URL, extract ?code=
 if (value.startsWith("http")) {
 try {
 const url = new URL(value);
 scannedCode = url.searchParams.get("code") || "";
 } catch {
 // Ignore invalid URLs
 }
 }

 setAccessCode(scannedCode);

 await verifyCode(scannedCode);

 setScannerOpen(false);
 }}
 />
 </main>
 );
}

export default function SecurityPage() {
 return (
 <Suspense fallback={<div>Loading...</div>}>
 <SecurityContent />
 </Suspense>
 );
}
