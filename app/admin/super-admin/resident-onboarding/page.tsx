"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clipboard, Download, FileUp, Mail, Phone, RefreshCw, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { parseResidentCsv } from "@/lib/resident-onboarding";

type Resident = {
 id: string; user_id: string | null; full_name: string | null; email: string | null; phone: string | null;
 house_number: string | null; street: string | null; close: string | null; is_active: boolean | null;
 account_active: boolean | null; activated: boolean; has_account: boolean; last_login: string | null;
 invitation_status: "Not Sent" | "Sent" | "Expired"; invitation_expires_at: string | null; invitation_link_valid: boolean;
 sent_at: string | null; sent_by: string | null; sent_by_name: string | null;
};

const estateName = "Thomas Ajufo Housing Estate";
const getAddress = (resident: Resident) => [resident.house_number, resident.street || resident.close].filter(Boolean).join(", ") || "Address not provided";
const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";
const formatDateTime = (date: string | null) => date ? new Date(date).toLocaleString("en-NG", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos", timeZoneName: "short" }) : "—";

function buildMessage(resident: Resident, activationLink: string) {
 const login = resident.email || resident.phone || "your registered contact";
 return `🏡 *Welcome to Entriseq!*\n\nHello ${resident.full_name || "Resident"},\n\nYour account for *${estateName}* has been created.\n\nEntriseq allows you to generate visitor passes, monitor visitor access, and receive important estate announcements.\n\n*How to get started:*\n\n1. Open your personal account activation link: ${activationLink}\n2. Create your password.\n3. Confirm your password and select *Stay signed in* only on your personal device.\n4. Set up a passkey for faster sign-in, or select Skip for now to open your dashboard.\n\nFor future sign-ins, use your registered email address (${login}) and the password you create.\n\n*Password advice:*\n\nChoose a password that is easy for you to remember but difficult for others to guess. Use at least 8 characters, including one uppercase letter and one special character (such as !, @, or #). Numbers are optional.\n\n*Important:* Never share your password or activation link with anyone.\n\nWebsite: https://entriseq.com\n\n*Entriseq — Smart Access for Safer Communities.*`;
}

function downloadCsv(residents: Resident[]) {
 const columns = ["Resident", "Address", "Phone", "Email", "Account Status", "Onboarding Status", "Invitation Status", "Last Login"];
 const lines = [columns, ...residents.map((resident) => [resident.full_name ?? "", getAddress(resident), resident.phone ?? "", resident.email ?? "", resident.account_active ? "Active" : "Inactive", resident.activated ? "Activated" : resident.invitation_status === "Sent" ? "Invited" : "Not Invited", resident.invitation_status, resident.last_login ?? ""])];
 const csv = lines.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
 const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
 const anchor = document.createElement("a"); anchor.href = url; anchor.download = "resident-onboarding.csv"; anchor.click(); URL.revokeObjectURL(url);
}

type ImportInput = { full_name: string; email: string; phone: string; house_number: string; location_name: string; location_type: "street" | "close" };

function mapImportRows(rows: Record<string, string>[]) {
 const latestByEmail = new Map<string, ImportInput>();
 let invalidCount = 0;
 let unconsentedCount = 0;
 let duplicateCount = 0;
 for (const row of rows) {
 const fullName = row["full name"] || row.name || "";
 const email = (row["email address"] || row.email || "").trim().toLowerCase();
 const phone = row["whatsapp phone number"] || row.phone || "";
 const houseNumber = row["house number"] || row.address || "";
 const locationName = row["close / street / way"] || row.street || row.close || "";
 const consent = row["do you consent to the use of your information as described in the privacy notice above?"];
 if (consent && !/^yes\s*,?\s*i agree$/i.test(consent)) { unconsentedCount += 1; continue; }
 if (!fullName.trim() || !/^\S+@\S+\.\S+$/.test(email) || !phone.trim() || !houseNumber.trim() || !locationName.trim()) { invalidCount += 1; continue; }
 if (latestByEmail.has(email)) duplicateCount += 1;
 latestByEmail.set(email, { full_name: fullName.trim(), email, phone: phone.trim(), house_number: houseNumber.trim(), location_name: locationName.trim(), location_type: /close/i.test(locationName) ? "close" : "street" });
 }
 return { rows: [...latestByEmail.values()], invalidCount, unconsentedCount, duplicateCount };
}

function Status({ children, tone = "muted" }: { children: string; tone?: "success" | "warning" | "danger" | "muted" }) {
 const tones = { success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300", danger: "bg-destructive/10 text-destructive", muted: "bg-muted text-muted-foreground" };
 return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export default function ResidentOnboardingPage() {
 const [residents, setResidents] = useState<Resident[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [accountFilter, setAccountFilter] = useState("all");
 const [onboardingFilter, setOnboardingFilter] = useState("all");
 const [invitationFilter, setInvitationFilter] = useState("all");
 const [page, setPage] = useState(1);
 const [workingId, setWorkingId] = useState<string | null>(null);
 const [importWorking, setImportWorking] = useState(false);
 const [selected, setSelected] = useState<Resident | null>(null);
 const [clockNow, setClockNow] = useState(() => Date.now());
 const [importPreview, setImportPreview] = useState<{ name: string; rows: Record<string, string>[] } | null>(null);
 const fileRef = useRef<HTMLInputElement>(null);

 const loadResidents = useCallback(async (): Promise<Resident[]> => {
 setLoading(true);
 try {
 const response = await fetch("/api/admin/super-admin/resident-onboarding", { cache: "no-store" });
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "Unable to load residents.");
 const nextResidents = result.residents ?? [];
 setResidents(nextResidents);
 return nextResidents;
 } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load residents."); }
 finally { setLoading(false); }
 return [];
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadResidents(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadResidents]);

 useEffect(() => {
 const intervalId = window.setInterval(() => setClockNow(Date.now()), 30_000);
 return () => window.clearInterval(intervalId);
 }, []);

 const filtered = useMemo(() => residents.filter((resident) => {
 const query = search.trim().toLowerCase();
 const onboarding = resident.activated ? "activated" : resident.invitation_status === "Sent" ? "invited" : "not invited";
 return (!query || [resident.full_name, resident.email, resident.phone, resident.house_number, resident.street, resident.close].some((value) => value?.toLowerCase().includes(query)))
 && (accountFilter === "all" || (accountFilter === "active") === Boolean(resident.account_active))
 && (onboardingFilter === "all" || onboarding === onboardingFilter)
 && (invitationFilter === "all" || resident.invitation_status.toLowerCase() === invitationFilter);
 }), [residents, search, accountFilter, onboardingFilter, invitationFilter]);
 const pageSize = 10;
 const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
 const visibleResidents = filtered.slice((page - 1) * pageSize, page * pageSize);

 const updateSearch = (value: string) => { setSearch(value); setPage(1); };
 const updateAccountFilter = (value: string) => { setAccountFilter(value); setPage(1); };
 const updateOnboardingFilter = (value: string) => { setOnboardingFilter(value); setPage(1); };
 const updateInvitationFilter = (value: string) => { setInvitationFilter(value); setPage(1); };

 const stats = [
 ["Total Residents", residents.length],
 ["Accounts Activated", residents.filter((resident) => resident.activated).length],
 ["Pending Activation", residents.filter((resident) => !resident.activated).length],
 ["Invitations Not Sent", residents.filter((resident) => resident.invitation_status === "Not Sent").length],
 ["Invitations Sent", residents.filter((resident) => resident.invitation_status === "Sent").length],
 ["Inactive Accounts", residents.filter((resident) => !resident.account_active).length],
 ] as const;

 async function copyMessage(resident: Resident) {
 if (!resident.has_account || !resident.account_active || resident.activated) { toast.error(resident.activated ? "This account is already activated." : "This resident does not have an active Entriseq account."); return; }
 setWorkingId(resident.id);
 try {
 const response = await fetch(`/api/admin/super-admin/resident-onboarding/${resident.id}/invitation`, { method: "POST" });
 const result = await response.json();
 if (!response.ok || !result.action_link) throw new Error(result.error || "Unable to create the activation link.");
 await navigator.clipboard.writeText(buildMessage(resident, result.action_link));
 toast.success("Message copied to clipboard");
 const refreshedResidents = await loadResidents();
 const refreshedResident = refreshedResidents.find((item) => item.id === resident.id);
 if (refreshedResident) setSelected(refreshedResident);
 } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to copy the message."); }
 finally { setWorkingId(null); }
 }

 async function markSent(resident: Resident) {
 setWorkingId(resident.id);
 try {
 const response = await fetch(`/api/admin/super-admin/resident-onboarding/${resident.id}/sent`, { method: "POST" });
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "Unable to update delivery status.");
 toast.success("Invitation marked as sent"); await loadResidents();
 } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update delivery status."); }
 finally { setWorkingId(null); }
 }

 async function previewImport(file: File) {
 try {
 if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Choose a CSV file for preview.");
 const rows = parseResidentCsv(await file.text());
 if (!rows.length) throw new Error("The selected file has no data rows.");
 setImportPreview({ name: file.name, rows });
 } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to preview this file."); }
 }

 async function confirmImport() {
 if (!importPreview) return;
 const preview = mapImportRows(importPreview.rows);
 if (!preview.rows.length) { toast.error("There are no valid, consented resident rows to import."); return; }
 if (!window.confirm(`Create or associate ${preview.rows.length} resident account(s)? Existing accounts will be skipped and existing non-resident roles will be preserved.`)) return;
 setImportWorking(true);
 try {
 const response = await fetch("/api/admin/super-admin/resident-onboarding/import", {
 method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: preview.rows }),
 });
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "Unable to import residents.");
 const created = result.outcomes.filter((outcome: { status: string }) => outcome.status === "created").length;
 const associated = result.outcomes.filter((outcome: { status: string }) => outcome.status === "associated").length;
 const skipped = result.outcomes.filter((outcome: { status: string }) => outcome.status === "skipped").length;
 const failed = result.outcomes.filter((outcome: { status: string }) => outcome.status === "failed").length;
 toast.success(`Import complete: ${created} created, ${associated} associated, ${skipped} skipped${failed ? `, ${failed} failed` : ""}.`);
 setImportPreview(null);
 await loadResidents();
 } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to import residents."); }
 finally { setImportWorking(false); }
 }

 return <AppShell size="full"><div className="flex flex-col gap-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
 <PageHeader title="Resident Onboarding" subtitle="Prepare personalized WhatsApp invitations and track pilot follow-up." />
 <div className="flex flex-wrap gap-2">
 <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void previewImport(file); event.currentTarget.value = ""; }} />
 <button onClick={() => fileRef.current?.click()} className="apple-secondary-button inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"><FileUp className="h-4 w-4" />Import Residents</button>
 <button onClick={() => downloadCsv(filtered)} disabled={!residents.length} className="apple-secondary-button inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Download className="h-4 w-4" />Export CSV</button>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
 {stats.map(([label, value]) => <section key={label} className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{loading ? "—" : value}</p></section>)}
 </div>

 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
 <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center">
 <label className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search residents</span><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search name, email, phone or address" className="apple-input w-full rounded-xl border border-border pl-10 pr-3 text-sm" /></label>
 <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
 <select aria-label="Filter account status" value={accountFilter} onChange={(event) => updateAccountFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="all">All account statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
 <select aria-label="Filter onboarding status" value={onboardingFilter} onChange={(event) => updateOnboardingFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="all">All onboarding statuses</option><option value="not invited">Not Invited</option><option value="invited">Invited</option><option value="activated">Activated</option></select>
 <select aria-label="Filter invitation status" value={invitationFilter} onChange={(event) => updateInvitationFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="all">All invitation statuses</option><option value="not sent">Not Sent</option><option value="sent">Sent</option><option value="expired">Expired</option></select>
 </div>
 </div>
 {loading ? <div className="space-y-3 p-5" aria-label="Loading residents">{[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div> : filtered.length === 0 ? <div className="flex flex-col items-center gap-3 px-6 py-16 text-center"><Users className="h-9 w-9 text-muted-foreground" /><h2 className="font-semibold">No residents found</h2><p className="text-sm text-muted-foreground">Try another search or clear your filters.</p></div> : <>
 <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="sticky top-0 bg-muted text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Resident", "Address", "Phone / Email", "Account", "Onboarding", "Invitation", "Last Login", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{visibleResidents.map((resident) => <tr key={resident.id} className="align-middle hover:bg-muted"><td className="px-4 py-4"><p className="font-semibold">{resident.full_name || "Name not provided"}</p><p className="mt-1 text-xs text-muted-foreground">{resident.email || "No email"}</p></td><td className="px-4 py-4">{getAddress(resident)}</td><td className="px-4 py-4"><p>{resident.phone || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{resident.email || "—"}</p></td><td className="px-4 py-4"><Status tone={resident.account_active ? "success" : "danger"}>{resident.account_active ? "Active" : "Inactive"}</Status></td><td className="px-4 py-4"><Status tone={resident.activated ? "success" : resident.invitation_status === "Sent" ? "warning" : "muted"}>{resident.activated ? "Activated" : resident.invitation_status === "Sent" ? "Invited" : "Not Invited"}</Status></td><td className="px-4 py-4"><Status tone={resident.invitation_status === "Sent" ? "success" : resident.invitation_status === "Expired" ? "danger" : "muted"}>{resident.invitation_status}</Status></td><td className="px-4 py-4 text-muted-foreground">{formatDate(resident.last_login)}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><button disabled={!resident.has_account || !resident.account_active || resident.activated || workingId === resident.id} onClick={() => void copyMessage(resident)} className="apple-primary-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Clipboard className="h-4 w-4" />{workingId === resident.id ? "Preparing…" : "Copy Message"}</button><button disabled={!resident.invitation_link_valid || resident.invitation_status === "Sent" || workingId === resident.id} onClick={() => void markSent(resident)} className="apple-secondary-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"><Check className="h-4 w-4" />Mark as Sent</button><button onClick={() => setSelected(resident)} aria-label={`View ${resident.full_name || "resident"}`} className="rounded-lg border border-border px-3 py-2.5 text-sm font-semibold">View</button></div></td></tr>)}</tbody></table></div>
 <div className="divide-y divide-border lg:hidden">{visibleResidents.map((resident) => <article key={resident.id} className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{resident.full_name || "Name not provided"}</h2><p className="mt-1 text-sm text-muted-foreground">{getAddress(resident)}</p></div><Status tone={resident.account_active ? "success" : "danger"}>{resident.account_active ? "Active" : "Inactive"}</Status></div><div className="space-y-1 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Phone className="h-4 w-4" />{resident.phone || "No phone"}</p><p className="flex items-center gap-2"><Mail className="h-4 w-4" />{resident.email || "No email"}</p></div><div className="flex flex-wrap gap-2"><Status tone={resident.activated ? "success" : resident.invitation_status === "Sent" ? "warning" : "muted"}>{resident.activated ? "Activated" : resident.invitation_status === "Sent" ? "Invited" : "Not Invited"}</Status><Status tone={resident.invitation_status === "Sent" ? "success" : resident.invitation_status === "Expired" ? "danger" : "muted"}>{resident.invitation_status}</Status></div><div className="grid grid-cols-2 gap-2"><button disabled={!resident.has_account || !resident.account_active || resident.activated || workingId === resident.id} onClick={() => void copyMessage(resident)} className="apple-primary-button col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"><Clipboard className="h-4 w-4" />Copy Message</button><button disabled={!resident.invitation_link_valid || resident.invitation_status === "Sent" || workingId === resident.id} onClick={() => void markSent(resident)} className="apple-secondary-button inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold disabled:opacity-45"><Check className="h-4 w-4" />Mark as Sent</button><button onClick={() => setSelected(resident)} className="rounded-xl border border-border px-3 py-2.5 text-sm font-semibold">View details</button></div></article>)}</div>
 <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} residents</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-border p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-border p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>
 </>}
 </section>
 </div>

 {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><aside role="dialog" aria-modal="true" aria-labelledby="resident-detail-title" className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Resident details</p><h2 id="resident-detail-title" className="mt-1 text-2xl font-bold">{selected.full_name || "Resident"}</h2></div><button onClick={() => setSelected(null)} aria-label="Close resident details" className="rounded-lg border border-border p-2"><X className="h-5 w-5" /></button></div><div className="mt-8 space-y-5">{[["Email", selected.email], ["Phone", selected.phone], ["Address", getAddress(selected)], ["Account", selected.account_active ? "Active" : "Inactive"], ["Onboarding", selected.activated ? "Activated" : selected.invitation_status === "Sent" ? "Invited" : "Not Invited"], ["Last login", formatDate(selected.last_login)], ["Invitation sent", selected.sent_at ? `${formatDateTime(selected.sent_at)}${selected.sent_by_name ? ` by ${selected.sent_by_name}` : ""}` : "—"]].map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value || "—"}</p></div>)}<div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activation link status</p>{(() => { const expired = Boolean(selected.invitation_expires_at && Date.parse(selected.invitation_expires_at) <= clockNow); const status = expired ? "Expired" : selected.invitation_expires_at ? "Within expiry window" : "No link generated"; return <><div className="mt-2"><Status tone={expired ? "danger" : selected.invitation_expires_at ? "success" : "muted"}>{status}</Status></div><p className="mt-2 text-sm font-medium">Expires {formatDateTime(selected.invitation_expires_at)}</p></>; })()}</div></div><div className="mt-8 flex gap-2"><button onClick={() => void copyMessage(selected)} className="apple-primary-button inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"><Clipboard className="h-4 w-4" />Copy Message</button><button disabled={!selected.has_account || !selected.account_active || selected.activated || workingId === selected.id} onClick={() => void copyMessage(selected)} className="rounded-xl border border-border px-4 py-3 disabled:opacity-45" title="Generate a fresh activation link and copy the onboarding message" aria-label="Renew activation link"><RefreshCw className="h-4 w-4" /></button></div></aside></div>}

 {importPreview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="import-title" className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-border p-5"><div><h2 id="import-title" className="text-lg font-bold">Import preview</h2><p className="mt-1 text-sm text-muted-foreground">{importPreview.name} · {importPreview.rows.length} rows. No changes are made until you confirm.</p></div><button onClick={() => setImportPreview(null)} aria-label="Close import preview" className="rounded-lg border border-border p-2"><X className="h-4 w-4" /></button></div><div className="max-h-[55vh] overflow-auto p-4"><p className="mb-3 text-sm text-muted-foreground">{(() => { const result = mapImportRows(importPreview.rows); return `${result.rows.length} valid unique accounts · ${result.duplicateCount} duplicate rows (latest response kept) · ${result.invalidCount} invalid rows · ${result.unconsentedCount} without consent`; })()}</p><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Phone</th><th className="p-2">Address</th></tr></thead><tbody>{importPreview.rows.slice(0, 100).map((row, index) => <tr key={index} className="border-b border-border"><td className="p-2">{row["full name"] || row["name"] || "—"}</td><td className="p-2">{row["email address"] || row.email || "—"}</td><td className="p-2">{row["whatsapp phone number"] || row.phone || "—"}</td><td className="p-2">{[row["house number"], row["close / street / way"] || row.street || row.close].filter(Boolean).join(", ") || "—"}</td></tr>)}</tbody></table>{importPreview.rows.length > 100 && <p className="p-3 text-sm text-muted-foreground">Showing first 100 rows.</p>}</div><div className="flex flex-wrap justify-end gap-2 border-t border-border p-4"><button onClick={() => setImportPreview(null)} className="rounded-xl border border-border px-4 py-2.5 font-semibold">Cancel</button><button onClick={() => void confirmImport()} disabled={importWorking || !mapImportRows(importPreview.rows).rows.length} className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">{importWorking ? "Importing…" : `Confirm Import (${mapImportRows(importPreview.rows).rows.length})`}</button></div></section></div>}
 </AppShell>;
}
