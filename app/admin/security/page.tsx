"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Shield, Phone, CalendarDays } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { SecurityOfficer } from "@/types/security";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";

export default function SecurityPage() {
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [officers, setOfficers] = useState<SecurityOfficer[]>([]);

 useEffect(() => {
 let isMounted = true;

 async function loadSecurityPersonnel() {
 const { data, error } = await supabase
 .from("security_personnel")
 .select(
 `
 id,
 full_name,
 email,
 phone,
 gate,
 team,
 is_active
 `,
 )
 .order("full_name");

 if (!isMounted) return;

 if (!error && data) {
 setOfficers(data);
 }

 setLoading(false);
 }

 void loadSecurityPersonnel();

 return () => {
 isMounted = false;
 };
 }, []);

 const filteredOfficers = officers.filter((officer) => {
 const query = search.toLowerCase();

 return (
 officer.full_name.toLowerCase().includes(query) ||
 officer.phone.toLowerCase().includes(query) ||
 officer.gate.toLowerCase().includes(query)
 );
 });
 return (
 <AppShell size="default">
 <div className="flex flex-col gap-6">
 <PageHeader
 title="Security Personnel"
 subtitle="Manage estate security officers"
 />

 {/* Search + Add Button */}

 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div className="relative w-full md:max-w-md">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
 <Search size={20} />
 </div>

 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by name, phone or gate..."
 className="w-full rounded-2xl border border-border bg-card py-3 pl-14 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <Link
 href="/admin/security/new"
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/100 px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary"
 >
 <Shield className="h-5 w-5" />
 Add Security Officer
 </Link>
 </div>

 {/* Security Personnel List */}

 <div className="rounded-3xl border border-border bg-card shadow-sm">
 {loading ? (
 <div className="flex justify-center py-16">
 Loading security officers...
 </div>
 ) : filteredOfficers.length === 0 ? (
 <div className="flex flex-col items-center gap-4 py-20">
 <Shield className="h-10 w-10 text-muted-foreground" />

 <p className="text-muted-foreground">No security officers found.</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {filteredOfficers.map((officer) => (
 <article
 key={officer.id}
 className="flex items-center justify-between px-6 py-5 transition rounded-3xl hover:bg-muted"
 >
 <div>
 <h2 className="font-semibold">{officer.full_name}</h2>

 <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
 <span className="flex items-center gap-1">
 <Shield className="h-4 w-4" />
 {officer.gate}
 </span>

 <span className="flex items-center gap-1">
 <CalendarDays className="h-4 w-4" />
 {officer.team}
 </span>

 <span className="flex items-center gap-1">
 <Phone className="h-4 w-4" />
 {officer.phone}
 </span>
 </div>
 </div>

 <span
 className={`rounded-full px-3 py-1 text-xs font-medium ${
 officer.is_active
 ? "bg-primary/15 text-primary"
 : "bg-destructive/15 text-destructive"
 }`}
 >
 {officer.is_active ? "Active" : "Inactive"}
 </span>
 </article>
 ))}
 </div>
 )}
 </div>
 </div>
 </AppShell>
 );
}
