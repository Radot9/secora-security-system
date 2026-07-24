"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { toast } from "sonner";
import { getDisplayVisitorStatus } from "@/lib/visitor-status";

type Visitor = {
 id: string;
 visitor_name: string;
 visitor_phone?: string;
 plate_number?: string;
 resident_name?: string;
 access_code: string;
 status: string;
 created_at: string;
 entry_time?: string;
 exit_time?: string;
 expires_at?: string;
 checked_in_by_name?: string;
 checked_out_by_name?: string;
};

export default function VisitorHistoryPage() {
 const [visitors, setVisitors] = useState<Visitor[]>([]);
 const [search, setSearch] = useState("");

 const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

 useEffect(() => {
 async function loadVisitors() {
 const { data, error } = await supabase
 .from("visitors")
 .select("id, visitor_name, visitor_phone, plate_number, resident_name, access_code, status, created_at, entry_time, exit_time, expires_at, checked_in_by_name, checked_out_by_name")
 .order("created_at", { ascending: false })
 .limit(250);

 if (error) {
 toast.error("Unable to load visitor history.");
 return;
 }

 setVisitors(data || []);
 }

 loadVisitors();
 }, []);

 const filteredVisitors = visitors.filter((visitor) => {
 const term = search.toLowerCase();

 return (
 visitor.visitor_name?.toLowerCase().includes(term) ||
 visitor.visitor_phone?.toLowerCase().includes(term) ||
 visitor.access_code?.toLowerCase().includes(term) ||
 visitor.plate_number?.toLowerCase().includes(term)
 );
 });

 return (
 <AppShell size="default">
 <div className="flex flex-col gap-6">
 <PageHeader
 title="Visitor History"
 subtitle="View all visitor records across the estate"
 />

 <input
 type="text"
 aria-label="Search visitor history"
 placeholder="Search visitors..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="rounded-2xl border border-border px-4 py-3 outline-none focus:border-ring"
 />

 {filteredVisitors.length === 0 ? (
 <EmptyState
 title="No Visitors Found"
 description="No visitor records match your search."
 />
 ) : (
 <div className="grid gap-4">
 {filteredVisitors.map((visitor) => (
 <Card
 key={visitor.id}
 onClick={() => setSelectedVisitor(visitor)}
 className="cursor-pointer transition hover:border-primary/40"
 >
 <div className="flex items-start justify-between">
 <div>
 <h2 className="text-lg font-semibold">
 {visitor.visitor_name}
 </h2>

 <p className="mt-1 text-sm text-muted-foreground">
 Code: {visitor.access_code}
 </p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Security Officers</p>
 <p className="text-sm">In: {visitor.checked_in_by_name || "Not recorded"} · Out: {visitor.checked_out_by_name || "Not recorded"}</p>
 </div>

 <StatusBadge status={getDisplayVisitorStatus({ status: visitor.status, expiresAt: visitor.expires_at })} />
 </div>
 <div className="mt-4 grid gap-3 md:grid-cols-2">
 <div>
 <p className="text-xs text-muted-foreground">Entry Time</p>

 <p className="text-sm">
 {visitor.entry_time
 ? new Date(visitor.entry_time).toLocaleString()
 : "Not Entered"}
 </p>
 </div>

 <div>
 <p className="text-xs text-muted-foreground">Exit Time</p>

 <p className="text-sm">
 {visitor.exit_time
 ? new Date(visitor.exit_time).toLocaleString()
 : "Still Inside"}
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Checked In By</p>
 <p>{visitor.checked_in_by_name || "Not recorded"}</p>
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Checked Out By</p>
 <p>{visitor.checked_out_by_name || "Not recorded"}</p>
 </div>
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>

 {selectedVisitor && (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
 role="presentation"
 onClick={() => setSelectedVisitor(null)}
 >
 <div
 className="w-full max-w-lg rounded-3xl bg-card p-6"
 role="dialog"
 aria-modal="true"
 aria-labelledby="visitor-details-title"
 onClick={(e) => e.stopPropagation()}
 >
 <h2 id="visitor-details-title" className="text-2xl font-bold">Visitor Details</h2>

 <div className="mt-6 space-y-4">
 <div>
 <p className="text-sm text-muted-foreground">Visitor</p>
 <p className="font-semibold">{selectedVisitor.visitor_name}</p>
 </div>

 <div>
 <p className="text-sm text-muted-foreground">Access Code</p>
 <p>{selectedVisitor.access_code}</p>
 </div>

 <div>
 <p className="text-sm text-muted-foreground">Status</p>
 <div className="mt-1">
 <StatusBadge status={getDisplayVisitorStatus({ status: selectedVisitor.status, expiresAt: selectedVisitor.expires_at })} />
 </div>
 </div>

 <div>
 <p className="text-sm text-muted-foreground">Entry Time</p>
 <p>
 {selectedVisitor.entry_time
 ? new Date(selectedVisitor.entry_time).toLocaleString()
 : "Not Entered"}
 </p>
 </div>

 <div>
 <p className="text-sm text-muted-foreground">Exit Time</p>
 <p>
 {selectedVisitor.exit_time
 ? new Date(selectedVisitor.exit_time).toLocaleString()
 : "Still Inside"}
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setSelectedVisitor(null)}
 className="mt-6 w-full rounded-2xl bg-primary/100 px-4 py-3 font-semibold text-primary-foreground"
 >
 Close
 </button>
 </div>
 </div>
 )}
 </AppShell>
 );
}
