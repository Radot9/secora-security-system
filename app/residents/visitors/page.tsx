"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";
import { AppShell } from "@/app/components/ui/AppShell";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { getDisplayVisitorStatus } from "@/lib/visitor-status";

export default function VisitorsPage() {
 const [visitors, setVisitors] = useState<Visitor[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [showExpiredOnly, setShowExpiredOnly] = useState(false);

 useEffect(() => {
 let isMounted = true;

 async function loadVisitors() {
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (isMounted) {
 setShowExpiredOnly(new URLSearchParams(window.location.search).get("status") === "expired");
 }

 if (!user) {
 if (isMounted) setLoading(false);
 return;
 }

 const { data: resident } = await supabase
 .from("residents")
 .select("id")
 .eq("user_id", user.id)
 .single();

 if (!resident) {
 if (isMounted) setLoading(false);
 return;
 }

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("resident_id", resident.id)
 .order("created_at", { ascending: false });

 if (!isMounted) return;

 if (!error && data) {
 setVisitors(data);
 }

 setLoading(false);
 }

 void loadVisitors();

 return () => {
 isMounted = false;
 };
 }, []);

 const filteredVisitors = useMemo(() => {
 const query = search.trim().toLowerCase();

 const statusFiltered = showExpiredOnly
 ? visitors.filter((visitor) => getDisplayVisitorStatus({ status: visitor.status, expiresAt: visitor.expires_at }) === "expired")
 : visitors;

 if (!query) return statusFiltered;

 return statusFiltered.filter((visitor) => {
 return (
 visitor.visitor_name.toLowerCase().includes(query) ||
 visitor.visitor_phone.toLowerCase().includes(query) ||
 visitor.access_code.toLowerCase().includes(query) ||
 visitor.plate_number?.toLowerCase().includes(query)
 );
 });
 }, [search, showExpiredOnly, visitors]);

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <header className="flex items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
 <p className="mt-2 text-sm text-muted-foreground">
 Manage guest access for your home
 {showExpiredOnly ? " · Showing expired codes" : ""}
 </p>
 </div>
 <Link
 href="/residents/generate-code"
 aria-label="Add new visitor"
 className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/100 text-primary-foreground shadow-sm transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M12 5v14M5 12h14" />
 </svg>
 </Link>
 </header>

 <div className="relative">
 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
 <input
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder="Search by visitor, phone, plate or code..."
 className="w-full rounded-2xl border border-border bg-card py-3 pl-12 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-muted/50">
 {loading ? (
 <div className="px-5 py-16 text-center text-sm text-muted-foreground">
 Loading visitors...
 </div>
 ) : filteredVisitors.length === 0 ? (
 <div className="px-5 py-16 text-center">
 <h2 className="font-semibold">No visitors found</h2>
 <p className="mt-2 text-sm text-muted-foreground">
 Create a visitor pass or adjust your search.
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[390px] border-collapse text-left text-sm">
 <thead className="bg-muted text-xs font-medium text-muted-foreground">
 <tr>
 <th className="px-4 py-3 font-medium">Name</th>
 <th className="px-3 py-3 font-medium">Phone number</th>
 <th className="px-3 py-3 font-medium">Code</th>
 <th className="px-3 py-3 font-medium">Status</th>
 <th className="px-3 py-3 font-medium">Time in</th>
 <th className="px-4 py-3 font-medium">Time out</th>
 <th className="px-4 py-3 font-medium">Security officers</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredVisitors.map((visitor) => (
 <tr key={visitor.id}>
 <td className="whitespace-nowrap px-4 py-4 text-foreground">
 {visitor.visitor_name}
 </td>
 <td className="whitespace-nowrap px-3 py-4 text-foreground">
 {visitor.visitor_phone}
 </td>
 <td className="whitespace-nowrap px-3 py-4 font-mono text-foreground">
 {visitor.access_code}
 </td>
 <td className="whitespace-nowrap px-3 py-4">
 <StatusBadge status={getDisplayVisitorStatus({ status: visitor.status, expiresAt: visitor.expires_at })} />
 </td>
 <td className="whitespace-nowrap px-3 py-4 text-foreground">
 {visitor.entry_time
 ? new Date(visitor.entry_time).toLocaleTimeString()
 : "--"}
 </td>
 <td className="whitespace-nowrap px-4 py-4 text-foreground">
 {visitor.exit_time
 ? new Date(visitor.exit_time).toLocaleTimeString()
 : "--"}
 </td>
 <td className="whitespace-nowrap px-4 py-4 text-foreground">
 <p>In: {visitor.checked_in_by_name || "--"}</p>
 <p>Out: {visitor.checked_out_by_name || "--"}</p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </section>
 </div>
 <ResidentBottomNav />
 </AppShell>
 );
}
