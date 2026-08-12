"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Ban, Car, CheckCircle2, ClipboardList, Copy, Phone, QrCode, Share2, UserRound } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { AppShell } from "../../components/ui/AppShell";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { displayVisitorStatus, visitorStatusClassName } from "@/lib/visitor-status";

type Visitor = {
 visitor_name: string;
 visitor_phone: string;
 purpose_of_visit: string | null;
 validity_duration_minutes: number | null;
 plate_number: string | null;
 expires_at: string | null;
 status: string;
};

function formatDuration(minutes: number | null) {
 if (!minutes) return "Duration not available";

 const hours = Math.floor(minutes / 60);
 const remainingMinutes = minutes % 60;
 const parts = [];

 if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
 if (remainingMinutes > 0) parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`);

 return parts.join(" ") || "0 minutes";
}

function AccessCodeContent() {
 const searchParams = useSearchParams();
 const requestedAccessCode = searchParams.get("code");
 const [accessCode, setAccessCode] = useState(requestedAccessCode);
 const [visitor, setVisitor] = useState<Visitor | null>(null);
 const [loading, setLoading] = useState(true);

 const qrValue = accessCode || "";
 const expiresAt = visitor?.expires_at ? new Date(visitor.expires_at).toLocaleString() : "No expiry set";
 const validityDuration = visitor ? formatDuration(visitor.validity_duration_minutes) : "Duration not available";

 const passText = useMemo(() => {
 if (!accessCode || !visitor) return "";
 return [
 `Entriseq visitor pass`,
 `Visitor: ${visitor.visitor_name}`,
 `Phone: ${visitor.visitor_phone}`,
 `Purpose: ${visitor.purpose_of_visit || "N/A"}`,
 `Valid for: ${validityDuration}`,
 `Access code: ${accessCode}`,
 `Plate number: ${visitor.plate_number || "N/A"}`,
 `Expires: ${expiresAt}`,
 ].join("\n");
 }, [accessCode, expiresAt, validityDuration, visitor]);

 useEffect(() => {
 let mounted = true;

 async function loadVisitor() {
 let codeToLoad = requestedAccessCode;

 if (!codeToLoad) {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 if (mounted) setLoading(false);
 return;
 }

 const { data: resident } = await supabase
 .from("residents")
 .select("id")
 .eq("user_id", user.id)
 .maybeSingle();

 if (!resident) {
 if (mounted) setLoading(false);
 return;
 }

 const { data: latestVisitor, error: latestError } = await supabase
 .from("visitors")
 .select("access_code")
 .eq("resident_id", resident.id)
 .order("created_at", { ascending: false })
 .limit(1)
 .maybeSingle();

 if (latestError || !latestVisitor?.access_code) {
 if (mounted) setLoading(false);
 return;
 }

 codeToLoad = latestVisitor.access_code;
 }

 if (!codeToLoad) {
 setLoading(false);
 return;
 }

 const { data, error } = await supabase
 .from("visitors")
 .select("visitor_name, visitor_phone, purpose_of_visit, validity_duration_minutes, plate_number, expires_at, status")
 .eq("access_code", codeToLoad)
 .single();

 if (!mounted) return;

 if (error || !data) {
 toast.error("Unable to load this access code.");
 setLoading(false);
 return;
 }

 setAccessCode(codeToLoad);
 setVisitor(data);
 setLoading(false);
 }

 void loadVisitor();

 return () => {
 mounted = false;
 };
 }, [requestedAccessCode]);

 function getPublicPassUrl() {
 return `${window.location.origin}/visitor-pass?code=${encodeURIComponent(accessCode ?? "")}`;
 }

 async function copyPassInfo() {
 if (!passText) return;

 try {
 await navigator.clipboard.writeText(`${passText}\nQR visitor pass: ${getPublicPassUrl()}`);
 toast.success("Access code info copied.");
 } catch {
 toast.error("Unable to copy this access code.");
 }
 }

 async function shareCode() {
 if (!passText) return;

 try {
 const publicPassUrl = getPublicPassUrl();
 if (navigator.share) {
 await navigator.share({
 title: "Entriseq Visitor Pass",
 text: `${passText}\nQR visitor pass: ${publicPassUrl}`,
 url: publicPassUrl,
 });
 return;
 }

 await copyPassInfo();
 } catch {
 toast.error("Unable to share this access code.");
 }
 }

 async function revokeCode() {
 if (!accessCode) return;

 const response = await fetch("/api/residents/visitors/revoke", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ accessCode }),
 });
 const result = await response.json();

 if (!response.ok) {
 toast.error(result.error ?? "Unable to revoke this access code.");
 return;
 }

 setVisitor((current) => current ? { ...current, status: "revoked" } : current);
 toast.success("Access code revoked.");
 }

 if (loading) {
 return (
 <AppShell size="full" residentSidebar>
 <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">
 Loading visitor pass...
 </div>
 </AppShell>
 );
 }

 if (!accessCode || !visitor) {
 return (
 <AppShell size="full" residentSidebar>
 <div className="flex min-h-[70vh] items-center justify-center text-center">
 <div>
 <QrCode className="mx-auto h-10 w-10 text-muted-foreground" />
 <h1 className="mt-4 text-xl font-bold">No access code found</h1>
 <p className="mt-2 text-sm text-muted-foreground">Generate a visitor pass first, then open the access code page.</p>
 <Link href="/residents/generate-code" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
 Generate Code
 </Link>
 </div>
 </div>
 </AppShell>
 );
 }

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <PageHeader title="Access Code Generated" subtitle="Copy or share this visitor pass with one click." />
 <button
 type="button"
 onClick={copyPassInfo}
 aria-label="Copy access code information"
 className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <Copy className="h-5 w-5" />
 Copy Pass
 </button>
 </div>

 <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
 <Card className="p-0">
 <div className="border-b border-border p-6">
 <div className="flex items-center justify-between gap-4">
 <div>
 <p className="text-sm font-medium text-muted-foreground">Generated access code</p>
 <p className="mt-3 break-all text-4xl font-black tracking-[0.2em] text-foreground">{accessCode}</p>
 </div>
 <button
 type="button"
 onClick={copyPassInfo}
 aria-label="Copy access code information"
 className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <Copy className="h-5 w-5" />
 </button>
 </div>
 </div>

 <div className="grid gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
 <div className="space-y-5 p-6">
 <div className="flex items-start gap-3">
 <UserRound className="mt-0.5 h-5 w-5 text-primary" />
 <div>
 <p className="text-sm text-muted-foreground">Visitor</p>
 <p className="mt-1 font-semibold">{visitor.visitor_name}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Phone className="mt-0.5 h-5 w-5 text-primary" />
 <div>
 <p className="text-sm text-muted-foreground">Phone</p>
 <p className="mt-1 font-semibold">{visitor.visitor_phone}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <ClipboardList className="mt-0.5 h-5 w-5 text-primary" />
 <div>
 <p className="text-sm text-muted-foreground">Purpose</p>
 <p className="mt-1 font-semibold">{visitor.purpose_of_visit || "N/A"}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Car className="mt-0.5 h-5 w-5 text-primary" />
 <div>
 <p className="text-sm text-muted-foreground">Plate number</p>
 <p className="mt-1 font-semibold">{visitor.plate_number || "N/A"}</p>
 </div>
 </div>
 </div>

 <div className="space-y-5 p-6">
 <div>
 <p className="text-sm text-muted-foreground">Status</p>
 <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${visitorStatusClassName(visitor.status)}`}>
 {displayVisitorStatus(visitor.status)}
 </span>
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Expires</p>
 <p className="mt-2 font-semibold">{expiresAt}</p>
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Valid for</p>
 <p className="mt-2 font-semibold">{validityDuration}</p>
 </div>
 <div className="rounded-2xl bg-primary/10 p-4">
 <div className="flex items-center gap-2 text-sm font-semibold text-primary">
 <CheckCircle2 className="h-4 w-4" />
 Ready to share
 </div>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">The copy button includes the visitor details, access code, expiry, and a link to the QR visitor pass.</p>
 </div>
 </div>
 </div>
 </Card>

 <Card className="flex flex-col items-center justify-center text-center">
 <p className="text-sm font-medium text-muted-foreground">Security QR</p>
 <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
 <QRCode value={qrValue} size={230} />
 </div>
 <p className="mt-5 text-sm leading-6 text-muted-foreground">Security can scan this QR or enter the access code manually.</p>
 </Card>
 </section>

 <section className="grid gap-4 sm:grid-cols-2">
 <button
 type="button"
 onClick={shareCode}
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <Share2 className="h-5 w-5" />
 Share Pass
 </button>
 <button
 type="button"
 onClick={revokeCode}
 className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <Ban className="h-5 w-5" />
 Revoke Code
 </button>
 </section>
 </div>
 </AppShell>
 );
}

export default function AccessCodePage() {
 return (
 <Suspense fallback={<div>Loading...</div>}>
 <AccessCodeContent />
 </Suspense>
 );
}
