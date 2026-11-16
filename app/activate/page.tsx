"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ActivateAccountPage() {
 const [tokenHash, setTokenHash] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [working, setWorking] = useState(false);
 const router = useRouter();

 useEffect(() => {
 const url = new URL(window.location.href);
 const hash = url.searchParams.get("token_hash");
 const type = url.searchParams.get("type");
 window.history.replaceState({}, document.title, url.pathname);
 const timer = window.setTimeout(() => {
 if (!hash || type !== "recovery") {
 setError("This activation link is missing or invalid. Ask your estate administrator for a fresh link.");
 return;
 }
 setTokenHash(hash);
 }, 0);
 return () => window.clearTimeout(timer);
 }, []);

 async function createPassword() {
 if (!tokenHash || working) return;
 setWorking(true);
 setError(null);
 const { error: verificationError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
 if (verificationError) {
 setError("This activation link has expired or was already used. Ask your estate administrator to generate a fresh link.");
 setTokenHash(null);
 setWorking(false);
 return;
 }
 router.replace("/update-password?mode=setup");
 router.refresh();
 }

 return <main className="flex min-h-screen items-center justify-center bg-[#edf6fc] px-4 py-10 text-foreground">
 <section className="w-full max-w-lg rounded-[2rem] border border-border bg-card/95 p-8 shadow-xl sm:p-10">
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/10 text-3xl font-bold text-emerald-700">S</div>
 <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.4em] text-emerald-700">Entriseq Security</p>
 <h1 className="mt-3 text-center text-3xl font-bold tracking-tight">Create your password</h1>
 <p className="mt-4 text-center leading-7 text-muted-foreground">Continue to securely activate your resident account and choose a password.</p>
 {error && <p role="alert" className="mt-6 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
 <button type="button" onClick={() => void createPassword()} disabled={!tokenHash || working} className="mt-8 w-full rounded-2xl bg-emerald-700 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
 {working ? "Verifying link…" : "Continue to create password"}
 </button>
 </section>
 </main>;
}
