"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { toast } from "sonner";

export default function GenerateCodePage() {
 const [visitorName, setVisitorName] = useState("");
 const [phoneNumber, setPhoneNumber] = useState("");
 const [plateNumber, setPlateNumber] = useState("");
 const [loading, setLoading] = useState(false);

 const [visitors, setVisitors] = useState<Visitor[]>([]);

 const router = useRouter();

 useEffect(() => {
 let isMounted = true;

 async function loadVisitors() {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) return;

 const { data: resident } = await supabase
 .from("residents")
 .select("id")
 .eq("user_id", user.id)
 .single();

 if (!resident) return;

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("resident_id", resident.id)
 .order("created_at", { ascending: false });

 if (isMounted && !error && data) {
 setVisitors(data);
 }
 }

 void loadVisitors();

 return () => {
 isMounted = false;
 };
 }, []);

 async function generateUniqueAccessCode() {
 for (let attempt = 0; attempt < 5; attempt += 1) {
 const code = Math.floor(100000 + Math.random() * 900000).toString();

 const { data } = await supabase
 .from("visitors")
 .select("id")
 .eq("access_code", code)
 .maybeSingle();

 if (!data) return code;
 }

 return `${Date.now()}`.slice(-8);
 }

 async function handleGenerateCode() {
 if (!visitorName || !phoneNumber) {
 toast.error("Visitor name and phone number are required.");
 return;
 }
 setLoading(true);

 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 toast.error("Please log in again.");
 setLoading(false);
 return;
 }

 const { data: resident, error: residentError } = await supabase
 .from("residents")
 .select("*")
 .eq("user_id", user.id)
 .maybeSingle();

 if (residentError || !resident) {
 setLoading(false);
 return;
 }
 const accessCode = await generateUniqueAccessCode();

 const { error } = await supabase.from("visitors").insert({
 visitor_name: visitorName,
 visitor_phone: phoneNumber,
 plate_number: plateNumber,

 resident_id: resident.id,
 resident_name: resident.full_name,

 access_code: accessCode,
 status: "pending",
 expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
 });

 if (error) {
 setLoading(false);
 toast.error(error.message);
 return;
 }
 setVisitorName("");
 setPhoneNumber("");
 setPlateNumber("");

 setLoading(false);

 router.push(`/residents/access-code?code=${accessCode}`);
 }

 return (
 <main className="min-h-screen bg-background px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-foreground">
 <div className="mx-auto flex w-full max-w-md lg:max-w-5xl flex-col gap-8">
 <header className="flex items-start gap-3">
 <Link
 href="/residents"
 aria-label="Back to visitors"
 className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <span
 aria-hidden="true"
 className="h-3 w-3 rotate-45 border-b-2 border-l-2 border-border"
 />
 </Link>
 <div>
 <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
 Access Code Generated
 </h1>
 <p className="mt-2 text-sm text-muted-foreground">
 Generate code for your guest
 </p>
 </div>
 </header>

 <section className="rounded-3xl bg-primary/10 p-5">
 <form className="space-y-5">
 <div className="space-y-2">
 <label
 htmlFor="visitor-name"
 className="block text-sm font-medium text-foreground"
 >
 Visitor&apos;s name
 </label>
 <input
 id="visitor-name"
 type="text"
 value={visitorName}
 onChange={(event) => setVisitorName(event.target.value)}
 placeholder="Enter visitor's name"
 autoComplete="name"
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div className="space-y-2">
 <label
 htmlFor="visitor-phone"
 className="block text-sm font-medium text-foreground"
 >
 Visitor&apos;s phone number
 </label>
 <input
 id="visitor-phone"
 type="tel"
 value={phoneNumber}
 onChange={(event) => setPhoneNumber(event.target.value)}
 placeholder="Enter phone number"
 autoComplete="tel"
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div className="space-y-2">
 <label
 htmlFor="plate-number"
 className="block text-sm font-medium text-foreground"
 >
 Visitor&apos;s vehicle plate number
 </label>
 <input
 id="plate-number"
 type="text"
 value={plateNumber}
 onChange={(event) => setPlateNumber(event.target.value)}
 placeholder="Enter plate number"
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <button
 type="button"
 onClick={handleGenerateCode}
 disabled={loading}
 className="inline-flex w-full items-center justify-center rounded-2xl bg-primary/100 px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
 >
 {loading ? "Generating..." : "Generate Code"}
 </button>
 </form>
 </section>

 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-muted/50">
 <div className="flex items-center justify-between px-4 py-5">
 <h2 className="text-lg font-semibold tracking-tight">Visitors</h2>
 <Link
 href="/residents/visitors"
 className="text-sm font-medium text-primary transition hover:text-primary/80"
 >
 View all
 </Link>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[390px] border-collapse text-left text-sm">
 <thead className="bg-muted text-xs font-medium text-muted-foreground">
 <tr>
 <th className="px-4 py-3 font-medium">Name</th>
 <th className="px-3 py-3 font-medium">Phone number</th>
 <th className="px-3 py-3 font-medium">Time in</th>
 <th className="px-4 py-3 font-medium">Time out</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {visitors.map((visitor) => (
 <tr key={visitor.id}>
 <td className="whitespace-nowrap px-4 py-4 text-foreground">
 {visitor.visitor_name}
 </td>
 <td className="whitespace-nowrap px-3 py-4 text-foreground">
 {visitor.visitor_phone}
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
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>
 </div>
 <ResidentBottomNav />
 </main>
 );
}
