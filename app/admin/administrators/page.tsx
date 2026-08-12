"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, UserPlus, Ban, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import type { Administrator, AdminInvitation } from "@/types/administrator";

type Confirmation = { title: string; description: string; label: string; destructive?: boolean; run: () => Promise<void> } | null;

export default function AdministratorsPage() {
 const [administrators, setAdministrators] = useState<Administrator[]>([]);
 const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
 const [loading, setLoading] = useState(true);
 const [working, setWorking] = useState(false);
 const [showInvite, setShowInvite] = useState(false);
 const [confirmation, setConfirmation] = useState<Confirmation>(null);
 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");

 const loadData = useCallback(async () => {
 const response = await fetch("/api/admin/administrators", { cache: "no-store" });
 const result = await response.json();
 if (!response.ok) toast.error(result.error);
 else { setAdministrators(result.administrators); setInvitations(result.invitations); }
 setLoading(false);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadData(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadData]);

 async function inviteAdministrator(event: React.FormEvent) {
 event.preventDefault(); setWorking(true);
 const response = await fetch("/api/admin/administrators", {
 method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, email, phone }),
 });
 const result = await response.json(); setWorking(false);
 if (!response.ok) {
 toast.error(result.error);
 return;
 }
 toast.success("Administrator invitation sent.");
 setFullName(""); setEmail(""); setPhone(""); setShowInvite(false); await loadData();
 }

 async function invitationAction(id: string, action: "resend" | "revoke") {
 setWorking(true);
 const response = await fetch(`/api/admin/administrators/invitations/${id}/${action}`, {
 method: "POST", headers: { "Content-Type": "application/json" }, body: action === "revoke" ? JSON.stringify({ reason: "Revoked by Super Admin" }) : undefined,
 });
 const result = await response.json(); setWorking(false); setConfirmation(null);
 if (!response.ok) {
 toast.error(result.error);
 return;
 }
 toast.success(action === "resend" ? "Invitation resent." : "Invitation revoked."); await loadData();
 }

 const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

 return (
 <AppShell size="wide">
 <div className="space-y-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <PageHeader title="Administrators" subtitle="Invite administrators and manage privileged access" />
 <button onClick={() => setShowInvite((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground"><UserPlus className="h-5 w-5" />Invite Administrator</button>
 </div>

 {showInvite && (
 <form onSubmit={inviteAdministrator} className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-3">
 <label className="text-sm font-medium">Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
 <label className="text-sm font-medium">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
 <label className="text-sm font-medium">Phone<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
 <button disabled={working} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground md:col-span-3 disabled:opacity-50">{working ? "Sending..." : "Send 72-hour invitation"}</button>
 </form>
 )}

 <section className="rounded-3xl border border-border bg-card shadow-sm">
 <div className="border-b border-border p-6"><h2 className="text-lg font-bold">Administrator accounts</h2></div>
 {loading ? <p className="p-8 text-muted-foreground">Loading administrators...</p> : administrators.length === 0 ? <p className="p-8 text-muted-foreground">No administrators found.</p> : (
 <div className="divide-y divide-border">{administrators.map((admin) => (
 <Link key={admin.id} href={`/admin/administrators/${admin.id}`} className="flex flex-col gap-3 p-6 transition hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between">
 <div><p className="font-semibold">{admin.full_name ?? "Profile incomplete"}</p><p className="mt-1 text-sm text-muted-foreground">{admin.email} · {admin.phone ?? "No phone"}</p></div>
 <div className="flex items-center gap-2"><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{admin.role === "super_admin" ? "Super Admin" : "Admin"}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${admin.is_active ? "bg-emerald-100 text-emerald-700" : "bg-destructive/15 text-destructive"}`}>{admin.is_active ? "Active" : "Inactive"}</span></div>
 </Link>
 ))}</div>
 )}
 </section>

 <section className="rounded-3xl border border-border bg-card shadow-sm">
 <div className="border-b border-border p-6"><h2 className="text-lg font-bold">Pending invitations</h2></div>
 {pendingInvitations.length === 0 ? <p className="p-8 text-muted-foreground">No pending invitations.</p> : <div className="divide-y divide-border">{pendingInvitations.map((invitation) => (
 <article key={invitation.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
 <div><p className="font-semibold">{invitation.full_name}</p><p className="mt-1 text-sm text-muted-foreground">{invitation.email} · Expires {new Date(invitation.expires_at).toLocaleString()}</p></div>
 <div className="flex gap-2">
 <button onClick={() => setConfirmation({ title: "Resend invitation?", description: `Send a new Entriseq invitation to ${invitation.email}?`, label: "Resend", run: () => invitationAction(invitation.id, "resend") })} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"><RotateCw className="h-4 w-4" />Resend</button>
 <button onClick={() => setConfirmation({ title: "Revoke invitation?", description: `${invitation.email} will no longer be able to complete administrator onboarding.`, label: "Revoke", destructive: true, run: () => invitationAction(invitation.id, "revoke") })} className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive"><Ban className="h-4 w-4" />Revoke</button>
 </div>
 </article>
 ))}</div>}
 </section>

 <div className="rounded-3xl bg-primary/10 p-6 text-sm text-muted-foreground"><ShieldCheck className="mb-3 h-6 w-6 text-primary" /><p>Only active Super Admins can view this page or perform these operations. Every change is verified on the server and recorded.</p></div>
 </div>
 <ConfirmationDialog open={Boolean(confirmation)} title={confirmation?.title ?? ""} description={confirmation?.description ?? ""} confirmLabel={confirmation?.label ?? "Confirm"} destructive={confirmation?.destructive} loading={working} onClose={() => setConfirmation(null)} onConfirm={() => void confirmation?.run()} />
 </AppShell>
 );
}
