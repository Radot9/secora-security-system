"use client";

import { CheckCircle2, Copy, Link2, MessageCircle, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/app/components/ui/Card";

type Status = {
 phone: string | null;
 identity: { phone: string; status: "active" | "revoked"; verifiedAt: string } | null;
};

export default function WhatsAppLinkCard() {
 const [status, setStatus] = useState<Status | null>(null);
 const [phone, setPhone] = useState("");
 const [challenge, setChallenge] = useState<{ value: string; expiresAt: string } | null>(null);
 const [loading, setLoading] = useState(true);

 async function loadStatus() {
  const response = await fetch("/api/residents/whatsapp", { cache: "no-store" });
  const result = await response.json();
  if (response.ok) {
   setStatus(result);
   setPhone(result.identity?.phone ?? result.phone ?? "");
  }
  setLoading(false);
 }

 useEffect(() => {
  let active = true;
  async function initialLoad() {
   const response = await fetch("/api/residents/whatsapp", { cache: "no-store" });
   const result = await response.json();
   if (!active) return;
   if (response.ok) {
    setStatus(result);
    setPhone(result.identity?.phone ?? result.phone ?? "");
   }
   setLoading(false);
  }
  void initialLoad();
  return () => { active = false; };
 }, []);

 async function startLinking() {
  setLoading(true);
  const response = await fetch("/api/residents/whatsapp", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ phone }),
  });
  const result = await response.json();
  setLoading(false);
  if (!response.ok) {
   toast.error(result.error ?? "Unable to create a linking code.");
   return;
  }
  setChallenge({ value: result.challenge, expiresAt: result.expiresAt });
  toast.success("WhatsApp linking code created.");
 }

 async function disconnect() {
  setLoading(true);
  const response = await fetch("/api/residents/whatsapp", { method: "DELETE" });
  const result = await response.json();
  setLoading(false);
  if (!response.ok) {
   toast.error(result.error ?? "Unable to disconnect WhatsApp.");
   return;
  }
  setChallenge(null);
  await loadStatus();
  toast.success("WhatsApp access disconnected.");
 }

 async function copyChallenge() {
  if (!challenge) return;
  await navigator.clipboard.writeText(challenge.value);
  toast.success("Linking code copied.");
 }

 const linked = status?.identity?.status === "active";

 return (
  <Card className="mt-6">
   <div className="flex items-start gap-3">
    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><MessageCircle className="h-6 w-6" /></div>
    <div>
     <h2 className="text-lg font-bold">WhatsApp visitor passes</h2>
     <p className="mt-1 text-sm leading-6 text-muted-foreground">Securely link your number to create and manage visitor passes from WhatsApp.</p>
    </div>
   </div>

   {linked ? (
    <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
     <p className="flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Connected</p>
     <p className="mt-2 text-sm text-muted-foreground">{status?.identity?.phone}</p>
     <button type="button" onClick={() => void disconnect()} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
      <Unlink className="h-4 w-4" /> Disconnect
     </button>
    </div>
   ) : (
    <div className="mt-5 space-y-4">
     <label className="block space-y-2">
      <span className="text-sm font-semibold">WhatsApp phone number</span>
      <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0803 123 4567" className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
     </label>
     <button type="button" onClick={() => void startLinking()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
      <Link2 className="h-4 w-4" /> {loading ? "Please wait..." : "Create linking code"}
     </button>
    </div>
   )}

   {challenge && !linked ? (
    <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4">
     <p className="text-sm font-semibold">Send this message to the Entriseq WhatsApp number:</p>
     <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-background p-3">
      <code className="text-lg font-black tracking-wider">{challenge.value}</code>
      <button type="button" onClick={() => void copyChallenge()} aria-label="Copy linking code" className="rounded-lg p-2 hover:bg-muted"><Copy className="h-4 w-4" /></button>
     </div>
     <p className="mt-3 text-xs text-muted-foreground">This code expires at {new Date(challenge.expiresAt).toLocaleTimeString()} and works once. Refresh this page after sending it.</p>
    </div>
   ) : null}
  </Card>
 );
}
