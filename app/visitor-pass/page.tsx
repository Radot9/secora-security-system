"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Copy, QrCode, ShieldCheck, Share2 } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

function VisitorPassContent() {
 const searchParams = useSearchParams();
 const accessCode = searchParams.get("code")?.trim() ?? "";
 const validCode = /^\d{6,8}$/.test(accessCode);

 async function copyCode() {
 await navigator.clipboard.writeText(accessCode);
 toast.success("Access code copied.");
 }

 async function sharePass() {
 const url = window.location.href;
 if (navigator.share) {
 await navigator.share({
 title: "Entriseq Visitor Pass",
 text: `Entriseq visitor access code: ${accessCode}`,
 url,
 });
 return;
 }

 await navigator.clipboard.writeText(`Entriseq visitor access code: ${accessCode}\nVisitor pass: ${url}`);
 toast.success("Visitor pass link copied.");
 }

 if (!validCode) {
 return (
 <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-foreground">
 <div className="max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
 <QrCode className="mx-auto h-10 w-10 text-muted-foreground" />
 <h1 className="mt-4 text-2xl font-bold">Invalid visitor pass</h1>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">
 Ask the resident to send you a new Entriseq visitor pass.
 </p>
 </div>
 </main>
 );
 }

 return (
 <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
 <article className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
 <header className="bg-primary p-6 text-center text-primary-foreground">
 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
 <ShieldCheck className="h-7 w-7" />
 </div>
 <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em]">Entriseq</p>
 <h1 className="mt-1 text-2xl font-bold">Visitor Pass</h1>
 </header>

 <div className="p-6 text-center sm:p-8">
 <p className="text-sm text-muted-foreground">Present this QR code at the security gate</p>
 <div className="mx-auto mt-5 w-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-border">
 <QRCode value={accessCode} size={230} />
 </div>

 <p className="mt-6 text-sm font-medium text-muted-foreground">Access code</p>
 <p className="mt-2 break-all text-4xl font-black tracking-[0.2em]">{accessCode}</p>
 <p className="mt-4 text-sm leading-6 text-muted-foreground">
 Security will verify the status and expiry of this pass before entry.
 </p>

 <div className="mt-6 grid gap-3 sm:grid-cols-2">
 <button
 type="button"
 onClick={copyCode}
 className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
 >
 <Copy className="h-5 w-5" />
 Copy Code
 </button>
 <button
 type="button"
 onClick={sharePass}
 className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
 >
 <Share2 className="h-5 w-5" />
 Share Pass
 </button>
 </div>

 <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
 Entriseq Estate Security
 </Link>
 </div>
 </article>
 </main>
 );
}

export default function VisitorPassPage() {
 return (
 <Suspense fallback={<main className="min-h-screen bg-background" />}>
 <VisitorPassContent />
 </Suspense>
 );
}
