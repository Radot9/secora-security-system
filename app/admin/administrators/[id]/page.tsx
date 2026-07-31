"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import type { Administrator } from "@/types/administrator";

type AuditLog = { id: string; action: string; actor_id: string | null; metadata: Record<string, unknown>; created_at: string };

export default function AdministratorDetailsPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const [administrator, setAdministrator] = useState<Administrator | null>(null);
 const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
 const [role, setRole] = useState<"admin" | "super_admin">("admin");
 const [active, setActive] = useState(true);
 const [reason, setReason] = useState("");
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [confirming, setConfirming] = useState(false);

 const loadAdministrator = useCallback(async () => {
 const response = await fetch(`/api/admin/administrators/${id}`, { cache: "no-store" });
 const result = await response.json();
 if (!response.ok) { toast.error(result.error); router.replace("/admin/administrators"); return; }
 setAdministrator(result.administrator); setAuditLogs(result.auditLogs);
 setRole(result.administrator.role); setActive(result.administrator.is_active); setLoading(false);
 }, [id, router]);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadAdministrator(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadAdministrator]);

 async function saveChanges() {
 setSaving(true);
 const response = await fetch(`/api/admin/administrators/${id}`, {
 method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, isActive: active, reason }),
 });
 const result = await response.json(); setSaving(false); setConfirming(false);
 if (!response.ok) return toast.error(result.error);
 toast.success("Administrator access updated."); await loadAdministrator();
 }

 if (loading || !administrator) return <main className="flex min-h-screen items-center justify-center text-muted-foreground">Loading administrator...</main>;
 const changed = role !== administrator.role || active !== administrator.is_active;

 return (
 <AppShell size="default">
 <div className="space-y-8">
 <PageHeader title={administrator.full_name ?? "Administrator"} subtitle={administrator.email} />
 <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-2">
 <div><p className="text-sm text-muted-foreground">Phone</p><p className="mt-1 font-semibold">{administrator.phone ?? "Not provided"}</p></div>
 <div><p className="text-sm text-muted-foreground">Onboarding</p><p className="mt-1 font-semibold">{administrator.onboarding_completed_at ? "Complete" : "Pending"}</p></div>
 <label className="text-sm font-medium">Role<select value={role} onChange={(e) => setRole(e.target.value as "admin" | "super_admin")} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></label>
 <label className="text-sm font-medium">Account status<select value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
 <label className="text-sm font-medium md:col-span-2">Reason for change<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Optional audit note" /></label>
 <button disabled={!changed || saving} onClick={() => setConfirming(true)} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50 md:col-span-2">Save access changes</button>
 </section>

 <section className="rounded-3xl border border-border bg-card">
 <div className="border-b border-border p-6"><h2 className="text-lg font-bold">Audit history</h2></div>
 {auditLogs.length === 0 ? <p className="p-6 text-muted-foreground">No administrator actions recorded yet.</p> : <div className="divide-y divide-border">{auditLogs.map((log) => <article key={log.id} className="p-6"><p className="font-semibold">{log.action.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p></article>)}</div>}
 </section>
 </div>
 <ConfirmationDialog open={confirming} title="Update administrator access?" description="This may immediately change dashboard access and authentication status. The action will be audited." confirmLabel="Update access" destructive={!active} loading={saving} onClose={() => setConfirming(false)} onConfirm={() => void saveChanges()} />
 </AppShell>
 );
}
