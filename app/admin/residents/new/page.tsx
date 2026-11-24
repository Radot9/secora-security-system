"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { toast } from "sonner";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function NewResidentPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);

 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [houseNumber, setHouseNumber] = useState("");
 const [locationType, setLocationType] = useState<"street" | "close">("street");
 const [locationName, setLocationName] = useState("");

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 setLoading(true);

 try {
 const response = await fetch("/api/admin/create-resident", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ fullName, email, phone, houseNumber, locationType, locationName }),
 });
 const result = await response.json();

 if (!response.ok) {
 if (result.error?.toLowerCase().includes("already")) {
 toast.warning("A resident or account with this email address already exists.");
 } else {
 toast.error(result.error || "Unable to create resident.");
 }
 return;
 }

 toast.success("Resident added. Continue to Resident Onboarding to prepare their activation invitation.");
 router.push("/admin/super-admin/resident-onboarding");
 } catch {
 toast.error("Unable to create resident.");
 } finally {
 setLoading(false);
 }
 }

 const inputClass = "w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

 return (
 <AppShell size="default">
 <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
 <PageHeader
 title="Add Resident"
 subtitle="Save resident details, then continue to Resident Onboarding to prepare their activation invitation."
 />

 <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
 <form className="space-y-6" onSubmit={handleSubmit}>
 <div>
 <label className="mb-2 block text-sm font-medium" htmlFor="full-name">Full Name</label>
 <input id="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required className={inputClass} />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium" htmlFor="email">Email Address</label>
 <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={inputClass} />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium" htmlFor="phone">Phone Number</label>
 <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required className={inputClass} />
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <div>
 <label className="mb-2 block text-sm font-medium" htmlFor="house-number">House Number</label>
 <input id="house-number" type="text" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} autoComplete="address-line1" required className={inputClass} />
 </div>

 <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
 <label>
 <span className="mb-2 block text-sm font-medium">Location Type</span>
 <select value={locationType} onChange={(event) => setLocationType(event.target.value as "street" | "close")} className={inputClass}>
 <option value="street">Street</option>
 <option value="close">Close</option>
 </select>
 </label>

 <label>
 <span className="mb-2 block text-sm font-medium">{locationType === "street" ? "Street Name" : "Close Name"}</span>
 <input type="text" value={locationName} onChange={(event) => setLocationName(event.target.value)} required placeholder={locationType === "street" ? "Example: Ajufo Street" : "Example: Ofili Close"} className={inputClass} />
 </label>
 </div>
 </div>

 <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
 {loading ? <LoadingSpinner className="h-5 w-5" /> : <Save className="h-5 w-5" />}
 {loading ? "Saving..." : "Save and Continue to Onboarding"}
 </button>
 </form>
 </div>
 </div>
 </AppShell>
 );
}
