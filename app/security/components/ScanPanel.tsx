"use client";

import { useState } from "react";
import { QrCode, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";

export default function ScanPanel() {
 const [accessCode, setAccessCode] = useState("");
 const [loading, setLoading] = useState(false);

 const [visitor, setVisitor] = useState<Visitor | null>(null);

 const [error, setError] = useState("");

 async function verifyVisitor() {
 if (!accessCode.trim()) {
 setError("Please enter an access code.");
 return;
 }

 setLoading(true);
 setError("");

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("access_code", accessCode)
 .maybeSingle();

 if (error) {
 setLoading(false);
 setError(error.message);
 return;
 }

 if (!data) {
 setLoading(false);
 setError("Visitor not found.");
 setVisitor(null);
 return;
 }

 setVisitor(data);
 setLoading(false);
 }

 return (
 <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
 <h2 className="text-xl font-bold">Verify Visitor</h2>

 <p className="mt-2 text-sm text-muted-foreground">
 Scan a QR code or enter the visitor&apos;s access code.
 </p>

 <div className="mt-6 flex h-56 items-center justify-center rounded-2xl border-2 border-dashed border-border">
 <div className="text-center">
 <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />

 <p className="mt-3 text-sm text-muted-foreground">QR Scanner Coming Soon</p>
 </div>
 </div>

 <div className="my-6 flex items-center gap-3">
 <div className="h-px flex-1 bg-muted" />

 <span className="text-xs uppercase tracking-wide text-muted-foreground">
 OR
 </span>

 <div className="h-px flex-1 bg-muted" />
 </div>

 <input
 type="text"
 placeholder="Enter 6-digit access code"
 value={accessCode}
 onChange={(e) => setAccessCode(e.target.value)}
 className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-ring"
 />

 <button
 onClick={verifyVisitor}
 disabled={loading}
 className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
 >
 <Search className="h-5 w-5" />

 {loading ? "Verifying..." : "Verify Visitor"}
 </button>
 {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
 {visitor && (
 <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
 <h3 className="text-lg font-bold">Visitor Verified</h3>

 <div className="mt-4 space-y-2">
 <p>
 <strong>Name:</strong> {visitor.visitor_name}
 </p>

 <p>
 <strong>Phone:</strong> {visitor.visitor_phone}
 </p>

 <p>
 <strong>Plate:</strong> {visitor.plate_number || "N/A"}
 </p>

 <p>
 <strong>Status:</strong> {visitor.status}
 </p>
 </div>
 </div>
 )}
 </div>
 );
}
