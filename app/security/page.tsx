"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import {
 Activity,
 CheckCircle2,
 Clock3,
 DoorOpen,
 IdCard,
 MapPin,
 QrCode,
 ShieldCheck,
 ShieldX,
 LogOut,
 UsersRound,
} from "lucide-react";

import ScannerModal from "./components/ScannerModal";
import ActivityTable from "./components/ActivityTable";
import VerificationCard from "./components/VerificationCard";
import VisitorDetailsModal from "./components/VisitorDetailsModal";
import { ActivityItem } from "@/types/activity";
import { toast } from "sonner";

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
}: {
 visitorName: string;
 visitorPhone: string;
 plateNumber: string;
 status: string;
 isExpired: boolean;
 allowEntry: () => void;
 checkOutVisitor: () => void;
}) {
 return (
 <section className="flex-1 rounded-3xl border border-border bg-card p-6 shadow-sm shadow-muted/50">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="h-5 w-5 text-primary" />
 <div>
 <h2 className="text-xl font-bold">Verification Result</h2>
 <p className="mt-1 text-sm text-muted-foreground">Visitor status appears immediately after verification.</p>
 </div>
 </div>

 {!visitorName ? (
 <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
 No visitor verified yet. Scan a QR code or enter an access code to see the result here.
 </div>
 ) : (
 <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
 <p className="text-sm text-muted-foreground">Visitor Found</p>
 <h3 className="mt-2 text-2xl font-bold">{visitorName}</h3>
 <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
 <p>Phone: {visitorPhone}</p>
 <p>Plate Number: {plateNumber || "N/A"}</p>
 </div>

 {isExpired ? (
 <p className="mt-4 font-semibold text-destructive">Pass expired</p>
 ) : status === "revoked" ? (
 <p className="mt-4 font-semibold text-destructive">Access revoked</p>
 ) : status === "pending" ? (
 <>
 <p className="mt-4 font-semibold text-primary">Valid access code</p>
 <button
 type="button"
 onClick={allowEntry}
 className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 Allow Entry
 </button>
 </>
 ) : status === "entered" ? (
 <>
 <p className="mt-4 font-semibold text-primary">Visitor already inside</p>
 <button
 type="button"
 onClick={checkOutVisitor}
 className="mt-4 w-full rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground transition hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 Check Out Visitor
 </button>
 </>
 ) : (
 <p className="mt-4 font-semibold text-muted-foreground">Visitor has left</p>
 )}
 </div>
 )}
 </section>
 );
}

function SecurityContent() {
 const searchParams = useSearchParams();
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

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("access_code", code)
 .maybeSingle();

 if (error) {
 toast.error(error.message);
 return;
 }

 if (!data) {
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
 .select("*")
 .or(`created_at.gte.${twentyFourHoursAgoIso},entry_time.gte.${twentyFourHoursAgoIso},exit_time.gte.${twentyFourHoursAgoIso}`);

 if (!isMounted) return;

 const recentVisitors = (visitors || [])
 .sort((first, second) => {
 const firstTime = Math.max(
 new Date(first.exit_time || 0).getTime(),
 new Date(first.entry_time || 0).getTime(),
 new Date(first.created_at || 0).getTime(),
 );
 const secondTime = Math.max(
 new Date(second.exit_time || 0).getTime(),
 new Date(second.entry_time || 0).getTime(),
 new Date(second.created_at || 0).getTime(),
 );

 return secondTime - firstTime;
 })
 .slice(0, 10);

 setActivity(recentVisitors);
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

 const { error } = await supabase
 .from("visitors")
 .update({
 status: "entered",
 entry_time: new Date().toISOString(),
 })
 .eq("id", visitorId);

 if (error) {
 toast.error(error.message);
 return;
 }
 setStatus("entered");
 setDashboardRefreshKey((current) => current + 1);
 toast.success("Visitor checked in successfully.");
 }

 async function checkOutVisitor() {
 if (!visitorId) return;

 const { error } = await supabase
 .from("visitors")
 .update({
 status: "exited",
 exit_time: new Date().toISOString(),
 })
 .eq("id", visitorId);

 if (error) {
 toast.error(error.message);
 return;
 }

 setStatus("exited");
 setDashboardRefreshKey((current) => current + 1);

 toast.success("Visitor checked out successfully.");
 }

 function getVisitorStatus(visitor: ActivityItem) {
 if (
 visitor.status === "pending" &&
 visitor.expires_at &&
 new Date(visitor.expires_at) < new Date()
 ) {
 return "expired";
 }

 return visitor.status;
 }

 const visitorStatusConfig = selectedVisitor
 ? statusConfig[
 getVisitorStatus(selectedVisitor) as keyof typeof statusConfig
 ] || statusConfig.pending
 : statusConfig.pending;

 const StatusIcon = visitorStatusConfig.icon;
 const officerName = officer?.full_name ?? "Security Officer";
 const officerInitials = initials(officerName);

 return (
 <main className="min-h-screen bg-background px-4 py-10 text-foreground lg:px-10">
 <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
 <header className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm shadow-muted/50">
 <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
 <div className="bg-primary/10 p-6 sm:p-8">
 <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
 <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-black text-primary-foreground shadow-sm">
 {officerInitials}
 </div>
 <div>
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
 Security dashboard
 </p>
 <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
 {officerName}
 </h1>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">
 Verify visitor passes, manage gate entry, and review recent access activity.
 </p>
 </div>
 </div>
 </div>

 <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
 <div className="p-6 sm:p-8">
 <div className="flex items-center gap-3">
 <MapPin className="h-5 w-5 text-primary" />
 <p className="text-sm font-medium text-muted-foreground">Gate duty</p>
 </div>
 <p className="mt-3 text-2xl font-bold">{dutyValue(officer?.gate)}</p>
 </div>
 <div className="p-6 sm:p-8">
 <div className="flex items-center gap-3">
 <IdCard className="h-5 w-5 text-primary" />
 <p className="text-sm font-medium text-muted-foreground">Team</p>
 </div>
 <p className="mt-3 text-2xl font-bold">{dutyValue(officer?.team)}</p>
 </div>
 </div>
 </div>
 </header>

 <section className="grid items-stretch gap-6 xl:grid-cols-[1.05fr_0.95fr]">
 <VerificationCard
 accessCode={accessCode}
 setAccessCode={setAccessCode}
 verifyCode={verifyCode}
 scannerOpen={() => setScannerOpen(true)}
 />

 <div className="flex h-full flex-col gap-6">
 <section className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-muted/50">
 <div className="flex items-start gap-4">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
 <ShieldCheck className="h-6 w-6" />
 </div>
 <div>
 <h2 className="text-xl font-bold">Duty checklist</h2>
 <div className="mt-4 space-y-3 text-sm text-muted-foreground">
 <p className="flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" /> Scan or enter each visitor access code.</p>
 <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Confirm visitor details before allowing entry.</p>
 <p className="flex items-center gap-2"><LogOut className="h-4 w-4 text-primary" /> Check visitors out when they leave the estate.</p>
 </div>
 </div>
 </div>
 </section>

 <VerificationResultCard
 visitorName={visitorName}
 visitorPhone={visitorPhone}
 plateNumber={plateNumber}
 status={status}
 isExpired={isExpired}
 allowEntry={allowEntry}
 checkOutVisitor={checkOutVisitor}
 />
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
 getVisitorStatus={getVisitorStatus}
 />
 </div>

 <VisitorDetailsModal
 visitor={selectedVisitor}
 visitorStatusConfig={visitorStatusConfig}
 StatusIcon={StatusIcon}
 onClose={() => setSelectedVisitor(null)}
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
