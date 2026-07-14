"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";
import { toast } from "sonner";

type Visitor = {
 visitor_name: string;
 visitor_phone: string;
 plate_number: string | null;
 expires_at: string | null;
 status: string;
};

function AccessCodeContent() {
 const searchParams = useSearchParams();
 const accessCode = searchParams.get("code");

 const [visitor, setVisitor] = useState<Visitor | null>(null);
 const qrValue = accessCode ? `/security?code=${accessCode}` : "";

 useEffect(() => {
 async function loadVisitor() {
 if (!accessCode) return;

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("access_code", accessCode)
 .single();

 if (error) {
 console.error(error);
 return;
 }

 setVisitor({
 visitor_name: data.visitor_name,
 visitor_phone: data.visitor_phone,
 plate_number: data.plate_number,
 expires_at: data.expires_at,
 status: data.status,
 });
 }

 loadVisitor();
 }, [accessCode]);

 async function shareCode() {
 if (!accessCode || !visitor) return;

 const text = `Secora visitor pass for ${visitor.visitor_name}. Access code: ${accessCode}`;

 try {
 if (navigator.share) {
 await navigator.share({
 title: "Secora Visitor Pass",
 text,
 });
 return;
 }

 await navigator.clipboard.writeText(text);
 toast.success("Access code copied.");
 } catch {
 toast.error("Unable to share this access code.");
 }
 }

 if (!accessCode) {
 return (
 <main className="flex min-h-screen items-center justify-center bg-background px-4">
 <p className="text-center text-sm text-muted-foreground">
 No access code was provided.
 </p>
 </main>
 );
 }

 if (!visitor) {
 return (
 <main className="min-h-screen flex items-center justify-center bg-background">
 <p className="text-muted-foreground">Loading visitor...</p>
 </main>
 );
 }

 async function revokeCode() {
 if (!accessCode) return;

 const { error } = await supabase
 .from("visitors")
 .update({
 status: "revoked",
 })
 .eq("access_code", accessCode);

 if (error) {
 toast.error(error.message);
 return;
 }

 setVisitor((current) =>
 current
 ? {
 ...current,
 status: "revoked",
 }
 : current,
 );

 toast.success("Access code revoked.");
 }

 return (
 <main className="min-h-screen bg-background px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-foreground">
 <div className="mx-auto flex w-full max-w-md lg:max-w-3xl flex-col gap-8">
 <header className="flex items-start gap-3">
 <Link
 href="/residents"
 aria-label="Back to residents"
 className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <span
 aria-hidden="true"
 className="h-3 w-3 rotate-45 border-b-2 border-l-2 border-border"
 />
 </Link>

 <div>
 <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
 Access Code Generated
 </h1>
 <p className="mt-2 text-sm text-muted-foreground">
 Share this code with your visitor
 </p>
 </div>
 </header>

 <section className="rounded-3xl bg-primary/10 p-6">
 <p className="text-sm text-muted-foreground">
 Authorised Visitor
 </p>

 <h2 className="mt-3 text-3xl font-semibold tracking-tight">
 {visitor.visitor_name}
 </h2>

 <p className="mt-2 text-sm text-muted-foreground">
 {visitor.visitor_phone}
 </p>

 <p className="mt-1 text-sm text-muted-foreground">
 Plate Number: {visitor.plate_number || "N/A"}
 </p>

 <span className="mt-4 inline-flex rounded-md bg-primary/100 px-3 py-1.5 text-xs font-medium text-primary-foreground">
 {visitor.status === "revoked" ? "Revoked" : "Authorised Visitor"}
 </span>

 <div className="my-5 h-px bg-border" />

 <p className="text-sm text-muted-foreground">Expires</p>

 <p className="mt-2 text-base font-semibold">
 {visitor.expires_at
 ? new Date(visitor.expires_at).toLocaleString()
 : "No expiry set"}
 </p>
 </section>

 <section className="flex flex-col items-center text-center">
 <p className="text-sm text-muted-foreground">
 Access Code
 </p>

 <p className="mt-5 text-3xl font-bold tracking-[0.2em]">
 {accessCode}
 </p>

 <div className="mt-8 rounded-2xl bg-card p-4">
 <QRCode value={qrValue} size={220} />
 </div>
 </section>

 <div className="mt-4 space-y-4 px-5">
 <button
 type="button"
 onClick={shareCode}
 className="inline-flex w-full items-center justify-center rounded-2xl bg-primary/100 px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring"
 >
 Share Code
 </button>

 <button
 type="button" onClick={revokeCode} 
 className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 Revoke Code
 </button>
 </div>
 </div>

 <ResidentBottomNav />
 </main>
 );
}

export default function AccessCodePage() {
 return (
 <Suspense fallback={<div>Loading...</div>}>
 <AccessCodeContent />
 </Suspense>
 );
}
