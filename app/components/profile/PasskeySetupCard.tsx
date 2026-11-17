"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PasskeySetupCard({ onContinue }: { onContinue?: () => void }) {
 const [supported, setSupported] = useState<boolean | null>(null);
 const [working, setWorking] = useState(false);
 const [message, setMessage] = useState("");
 const [registered, setRegistered] = useState(false);

 useEffect(() => {
  const timer = window.setTimeout(() => setSupported(window.isSecureContext && Boolean(window.PublicKeyCredential)), 0);
  return () => window.clearTimeout(timer);
 }, []);

 async function register() {
  if (working) return;
  setWorking(true);
  setMessage("");
  try {
   const { data, error } = await supabase.auth.registerPasskey();
   if (error || !data) {
    setMessage(error?.code === "passkey_disabled"
     ? "Passkeys are not enabled for this site yet. You can continue using your password."
     : "Passkey setup was not completed. Try again, or continue using your password.");
    return;
   }
   setRegistered(true);
   setMessage("Passkey saved. You can use it to sign in next time.");
  } catch {
   setMessage("Passkey setup is unavailable. You can continue using your password.");
  } finally { setWorking(false); }
 }

 return <section className="space-y-5 rounded-3xl border border-border bg-card p-6">
  <div><h2 className="text-xl font-semibold">{registered ? "Your passkey is ready" : "Set up a passkey"}</h2>
  <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in with your device’s fingerprint, face recognition, or screen lock. Your password remains available.</p></div>
  {supported === false && <p className="text-sm text-muted-foreground">This browser cannot set up a passkey. You can continue using your password.</p>}
  {message && <p role="status" className="text-sm leading-6">{message}</p>}
  {!registered && <button type="button" disabled={!supported || working} onClick={() => void register()} className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{working ? "Waiting for your device…" : "Create passkey"}</button>}
  {onContinue && <button type="button" disabled={working} onClick={onContinue} className="w-full rounded-2xl border border-border px-4 py-3 font-semibold disabled:opacity-50">{registered ? "Open dashboard" : "Skip for now and open dashboard"}</button>}
 </section>;
}
