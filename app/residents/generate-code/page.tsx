"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 Car,
 Clock3,
 ClipboardList,
 Phone,
 Plus,
 ShieldCheck,
 Sparkles,
 UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { AppShell } from "../../components/ui/AppShell";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";
import { displayVisitorStatus, visitorStatusClassName } from "@/lib/visitor-status";

const MINIMUM_CODE_VALIDITY_MINUTES = 30;

function formatExpiry(value: string | null) {
 if (!value) return "No expiry set";

 return new Date(value).toLocaleString([], {
  dateStyle: "medium",
  timeStyle: "short",
 });
}

function formatDuration(minutes: number | null) {
 if (!minutes) return "Duration not available";

 const hours = Math.floor(minutes / 60);
 const remainingMinutes = minutes % 60;
 const parts = [];

 if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
 if (remainingMinutes > 0) parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`);

 return parts.join(" ") || "0 minutes";
}

export default function GenerateCodePage() {
 const [visitorName, setVisitorName] = useState("");
 const [phoneNumber, setPhoneNumber] = useState("");
 const [purposeOfVisit, setPurposeOfVisit] = useState("");
 const [validityHours, setValidityHours] = useState("0");
 const [validityRemainderMinutes, setValidityRemainderMinutes] = useState(`${MINIMUM_CODE_VALIDITY_MINUTES}`);
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
    .order("created_at", { ascending: false })
    .limit(6);

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
  const trimmedVisitorName = visitorName.trim();
  const trimmedPhoneNumber = phoneNumber.trim();
  const trimmedPurpose = purposeOfVisit.trim();
  const trimmedPlateNumber = plateNumber.trim();

  if (!trimmedVisitorName) {
   toast.error("Visitor name is required.");
   return;
  }

  if (!trimmedPhoneNumber) {
   toast.error("Visitor phone number is required.");
   return;
  }

  if (!trimmedPurpose) {
   toast.error("Purpose of visit is required.");
   return;
  }

  if (!validityHours.trim() && !validityRemainderMinutes.trim()) {
   toast.error("Code validity time is required.");
   return;
  }

  const parsedValidityHours = Number(validityHours || 0);
  const parsedValidityRemainderMinutes = Number(validityRemainderMinutes || 0);
  const parsedValidityMinutes = (parsedValidityHours * 60) + parsedValidityRemainderMinutes;

  if (
   !Number.isFinite(parsedValidityHours) ||
   !Number.isFinite(parsedValidityRemainderMinutes) ||
   !Number.isInteger(parsedValidityHours) ||
   !Number.isInteger(parsedValidityRemainderMinutes) ||
   parsedValidityHours < 0 ||
   parsedValidityRemainderMinutes < 0 ||
   parsedValidityRemainderMinutes > 59
  ) {
   toast.error("Enter a valid code duration in hours and minutes.");
   return;
  }

  if (parsedValidityMinutes < MINIMUM_CODE_VALIDITY_MINUTES) {
   toast.error("Code validity must be at least 30 minutes.");
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
   toast.error("Unable to find your resident profile. Please log in again.");
   setLoading(false);
   return;
  }

  const accessCode = await generateUniqueAccessCode();

  const { error } = await supabase.from("visitors").insert({
   visitor_name: trimmedVisitorName,
   visitor_phone: trimmedPhoneNumber,
   purpose_of_visit: trimmedPurpose,
   plate_number: trimmedPlateNumber || null,
   resident_id: resident.id,
   resident_name: resident.full_name,
   access_code: accessCode,
   status: "pending",
   validity_duration_minutes: parsedValidityMinutes,
   expires_at: new Date(Date.now() + parsedValidityMinutes * 60 * 1000).toISOString(),
  });

  if (error) {
   setLoading(false);
   toast.error(error.message);
   return;
  }

  setVisitorName("");
  setPhoneNumber("");
  setPurposeOfVisit("");
  setValidityHours("0");
  setValidityRemainderMinutes(`${MINIMUM_CODE_VALIDITY_MINUTES}`);
  setPlateNumber("");
  setLoading(false);

  toast.success("Visitor access code generated.");
  router.push(`/residents/access-code?code=${accessCode}`);
 }

 return (
  <AppShell size="full" residentSidebar>
   <div className="resident-page">
    <PageHeader
     title="Generate Visitor Pass"
     subtitle="Create a secure access code and decide how long it should stay valid."
    />

    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
     <Card className="overflow-hidden p-0">
      <div className="m-4 rounded-3xl bg-primary/10 p-6">
       <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
         <Sparkles className="h-6 w-6" />
        </div>
        <div>
         <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">New visitor</p>
         <h2 className="mt-2 text-2xl font-black tracking-tight">Create access details</h2>
         <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Access codes must stay valid for at least 30 minutes. We will notify you with a toast if anything is missing.
         </p>
        </div>
       </div>
      </div>

      <form className="grid gap-5 p-6" onSubmit={(event) => event.preventDefault()}>
       <div className="grid gap-5 md:grid-cols-2">
        <label htmlFor="visitor-name" className="space-y-2">
         <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserRound className="h-4 w-4 text-primary" />
          Visitor name
         </span>
         <input
          id="visitor-name"
          type="text"
          value={visitorName}
          onChange={(event) => setVisitorName(event.target.value)}
          placeholder="Enter visitor name"
          autoComplete="name"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
         />
        </label>

        <label htmlFor="visitor-phone" className="space-y-2">
         <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Phone className="h-4 w-4 text-primary" />
          Phone number
         </span>
         <input
          id="visitor-phone"
          type="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="Enter phone number"
          autoComplete="tel"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
         />
        </label>
       </div>

       <label htmlFor="purpose-of-visit" className="space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
         <ClipboardList className="h-4 w-4 text-primary" />
         Purpose of visit
        </span>
        <textarea
         id="purpose-of-visit"
         value={purposeOfVisit}
         onChange={(event) => setPurposeOfVisit(event.target.value)}
         placeholder="Example: Family visit, delivery, inspection"
         rows={4}
         className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
       </label>

       <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
         <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock3 className="h-4 w-4 text-primary" />
          Code validity time
         </span>
         <div className="grid grid-cols-2 gap-3">
          <label htmlFor="validity-hours" className="space-y-2">
           <input
            id="validity-hours"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={validityHours}
            onChange={(event) => setValidityHours(event.target.value)}
            placeholder="0"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
           />
           <span className="block text-xs text-muted-foreground">Hours</span>
          </label>

          <label htmlFor="validity-minutes" className="space-y-2">
           <input
            id="validity-minutes"
            type="number"
            min="0"
            max="59"
            step="5"
            inputMode="numeric"
            value={validityRemainderMinutes}
            onChange={(event) => setValidityRemainderMinutes(event.target.value)}
            placeholder="30"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
           />
           <span className="block text-xs text-muted-foreground">Minutes</span>
          </label>
         </div>
         <p className="text-xs text-muted-foreground">Minimum duration is 30 minutes.</p>
        </div>

        <label htmlFor="plate-number" className="space-y-2">
         <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Car className="h-4 w-4 text-primary" />
          Vehicle plate number
         </span>
         <input
          id="plate-number"
          type="text"
          value={plateNumber}
          onChange={(event) => setPlateNumber(event.target.value)}
          placeholder="Enter plate number"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm uppercase text-foreground outline-none transition placeholder:normal-case placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
         />
        </label>
       </div>

       <button
        type="button"
        onClick={handleGenerateCode}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
       >
        <Plus className="h-5 w-5" />
        {loading ? "Generating pass..." : "Generate Access Code"}
       </button>
      </form>
     </Card>

     <div className="grid gap-6">
      <Card className="bg-gradient-to-br from-primary/15 via-card to-card">
       <ShieldCheck className="h-10 w-10 text-primary" />
       <h2 className="mt-4 text-xl font-bold">How this pass works</h2>
       <div className="mt-5 space-y-4">
        <div className="flex items-start gap-3">
         <Clock3 className="mt-0.5 h-5 w-5 text-primary" />
         <p className="text-sm leading-6 text-muted-foreground">
          The code validity duration cannot be less than 30 minutes.
         </p>
        </div>
        <div className="flex items-start gap-3">
         <ClipboardList className="mt-0.5 h-5 w-5 text-primary" />
         <p className="text-sm leading-6 text-muted-foreground">
          The generated pass includes the visitor, phone, purpose, expiry time, plate if provided, and access code.
         </p>
        </div>
       </div>
      </Card>

      <Card>
       <div className="flex items-center justify-between gap-4">
        <div>
         <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Recent</p>
         <h2 className="mt-2 text-xl font-bold">Visitor passes</h2>
        </div>
        <Link href="/residents/visitors" className="text-sm font-semibold text-primary transition hover:text-primary/80">
         View all
        </Link>
       </div>

       <div className="mt-5 space-y-3">
        {visitors.length === 0 ? (
         <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          No visitor passes created yet.
         </div>
        ) : (
         visitors.map((visitor) => (
          <div key={visitor.id} className="rounded-2xl border border-border bg-background p-4">
           <div className="flex items-start justify-between gap-4">
            <div>
             <p className="font-semibold text-foreground">{visitor.visitor_name}</p>
             <p className="mt-1 text-sm text-muted-foreground">{visitor.visitor_phone}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${visitorStatusClassName(visitor.status)}`}>
             {displayVisitorStatus(visitor.status)}
            </span>
           </div>
           <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
           <p className="flex items-center gap-2">
             <Clock3 className="h-4 w-4 text-primary" />
             Valid for {formatDuration(visitor.validity_duration_minutes)}
            </p>
            <p className="flex items-center gap-2">
             <Clock3 className="h-4 w-4 text-primary" />
             Expires {formatExpiry(visitor.expires_at)}
            </p>
            <p className="line-clamp-2 flex gap-2">
             <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
             <span>{visitor.purpose_of_visit || "Purpose not available"}</span>
            </p>
           </div>
          </div>
         ))
        )}
       </div>
      </Card>
     </div>
    </section>
   </div>
   <ResidentBottomNav />
  </AppShell>
 );
}
