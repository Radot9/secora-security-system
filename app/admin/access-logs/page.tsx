"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { ActivityItem } from "@/types/activity";
import { AppShell } from "@/app/components/ui/AppShell";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { getDisplayVisitorStatus } from "@/lib/visitor-status";

export default function AccessLogsPage() {
 const [activity, setActivity] = useState<ActivityItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [status, setStatus] = useState("all");

 useEffect(() => {
 let isMounted = true;

 async function loadLogs() {
 const { data, error } = await supabase
 .from("visitors")
 .select("id, visitor_name, visitor_phone, resident_name, access_code, status, created_at, entry_time, exit_time, expires_at, checked_in_by, checked_in_by_name, checked_out_by, checked_out_by_name")
 .order("created_at", { ascending: false })
 .limit(100);

 if (!isMounted) return;

 if (!error && data) {
 setActivity(data);
 }

 setLoading(false);
 }

 void loadLogs();

 return () => {
 isMounted = false;
 };
 }, []);

 const filteredActivity = useMemo(() => {
 const term = search.trim().toLowerCase();

 return activity.filter((item) => {
 const displayStatus = getDisplayVisitorStatus({ status: item.status, expiresAt: item.expires_at });
 const matchesStatus = status === "all" || displayStatus === status;
 const matchesSearch =
 !term ||
 item.visitor_name.toLowerCase().includes(term) ||
 item.access_code.toLowerCase().includes(term) ||
 item.visitor_phone?.toLowerCase().includes(term) ||
 item.resident_name?.toLowerCase().includes(term);

 return matchesStatus && matchesSearch;
 });
 }, [activity, search, status]);

 return (
 <AppShell size="wide">
 <div className="flex flex-col gap-6">
 <PageHeader
 title="Access Logs"
 subtitle="Review recent visitor verification and movement activity"
 />

 <div className="grid gap-3 md:grid-cols-[1fr_220px]">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
 <input
 aria-label="Search access logs"
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder="Search by visitor, resident, phone or code..."
 className="w-full rounded-2xl border border-border bg-card py-3 pl-12 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <select
 aria-label="Filter access logs by status"
 value={status}
 onChange={(event) => setStatus(event.target.value)}
 className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
 >
 <option value="all">All statuses</option>
 <option value="pending">Pending</option>
 <option value="entered">Entered</option>
 <option value="exited">Exited</option>
 <option value="revoked">Revoked</option>
 <option value="expired">Expired</option>
 </select>
 </div>

 {loading ? (
 <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
 Loading access logs...
 </div>
 ) : filteredActivity.length === 0 ? (
 <EmptyState
 title="No Access Logs Found"
 description="No visitor records match the current search and filter."
 />
 ) : (
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full min-w-[760px] text-left text-sm">
 <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
 <tr>
 <th className="px-5 py-4 font-semibold">Visitor</th>
 <th className="px-5 py-4 font-semibold">Resident</th>
 <th className="px-5 py-4 font-semibold">Code</th>
 <th className="px-5 py-4 font-semibold">Status</th>
 <th className="px-5 py-4 font-semibold">Entry</th>
 <th className="px-5 py-4 font-semibold">Exit</th>
 <th className="px-5 py-4 font-semibold">Security Officers</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredActivity.map((item) => (
 <tr key={item.id}>
 <td className="px-5 py-4">
 <p className="font-semibold">{item.visitor_name}</p>
 <p className="mt-1 text-xs text-muted-foreground">
 {item.visitor_phone || "No phone"}
 </p>
 </td>
 <td className="px-5 py-4 text-foreground">
 {item.resident_name || "N/A"}
 </td>
 <td className="px-5 py-4 font-mono text-foreground">
 {item.access_code}
 </td>
 <td className="px-5 py-4">
 <StatusBadge status={getDisplayVisitorStatus({ status: item.status, expiresAt: item.expires_at })} />
 </td>
 <td className="px-5 py-4 text-foreground">
 {item.entry_time
 ? new Date(item.entry_time).toLocaleString()
 : "Not entered"}
 </td>
 <td className="px-5 py-4 text-foreground">
 {item.exit_time
 ? new Date(item.exit_time).toLocaleString()
 : "Still inside"}
 </td>
 <td className="px-5 py-4 text-foreground">
 <p>In: {item.checked_in_by_name || "Not recorded"}</p>
 <p className="mt-1">Out: {item.checked_out_by_name || "Not recorded"}</p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 </AppShell>
 );
}
