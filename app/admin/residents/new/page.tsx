"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { toast } from "sonner";
import { generatePassword } from "@/lib/utils/generatePassword";
import SuccessDialog from "@/app/components/ui/SuccessDialog";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function NewResidentPage() {
 const [loading, setLoading] = useState(false);

 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [houseNumber, setHouseNumber] = useState("");
 const [locationType, setLocationType] = useState<"street" | "close">("street");
 const [locationName, setLocationName] = useState("");

 const [password, setPassword] = useState(() => generatePassword());

 const [dialogOpen, setDialogOpen] = useState(false);

 const [createdResident, setCreatedResident] = useState<{
 fullName: string;
 email: string;
 phone: string;
 password: string;
 } | null>(null);

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();

 setLoading(true);

 try {
 const response = await fetch("/api/admin/create-resident", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 fullName,
 email,
 password,
 phone,
 houseNumber,
 locationType,
 locationName,
 }),
 });

 const result = await response.json();

 if (!response.ok) {
 if (result.error?.toLowerCase().includes("already")) {
 toast.warning("A resident with this email address already exists.");
 } else {
 toast.error(result.error);
 }

 return;
 }

 setCreatedResident({
 fullName,
 email,
 phone,
 password,
 });

 setFullName("");
 setEmail("");
 setPhone("");
 setHouseNumber("");
 setLocationType("street");
 setLocationName("");
 setPassword(generatePassword());
 toast.success("Resident account created successfully.");
 setDialogOpen(true);
 } catch {
 toast.error("Unable to create resident.");
 } finally {
 setLoading(false);
 }
 }

 function handleDialogClose() {
 setDialogOpen(false);

 setCreatedResident(null);
 }

 return (
 <AppShell size="default">
 <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
 <PageHeader
 title="Add Resident"
 subtitle="Create a new resident account"
 />

 <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
 <form className="space-y-6" onSubmit={handleSubmit}>
 <div>
 <label className="mb-2 block text-sm font-medium">
 Full Name
 </label>
 <input
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium">
 Email Address
 </label>

 <input
 type="text"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <div>
 <label className="mb-2 block text-sm font-medium">
 Phone Number
 </label>

 <input
 type="text"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium">
 Temporary Password
 </label>

 <div className="flex gap-3">
 <input
 type="text"
 value={password}
 readOnly
 className="flex-1 rounded-2xl border border-border bg-muted px-4 py-3 outline-none"
 />

 <button
 type="button"
 onClick={() => setPassword(generatePassword())}
 className="rounded-2xl bg-secondary px-4 text-secondary-foreground transition hover:bg-muted"
 >
 Generate
 </button>
 </div>
 </div>
 </div>

 <div className="grid gap-6 md:grid-cols-2">
 <div>
 <label className="mb-2 block text-sm font-medium">
 House Number
 </label>

 <input
 type="text"
 value={houseNumber}
 onChange={(e) => setHouseNumber(e.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
 <label>
 <span className="mb-2 block text-sm font-medium">Location Type</span>
 <select
 value={locationType}
 onChange={(event) => setLocationType(event.target.value as "street" | "close")}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 >
 <option value="street">Street</option>
 <option value="close">Close</option>
 </select>
 </label>

 <label>
 <span className="mb-2 block text-sm font-medium">
 {locationType === "street" ? "Street Name" : "Close Name"}
 </span>
 <input
 type="text"
 value={locationName}
 onChange={(event) => setLocationName(event.target.value)}
 placeholder={locationType === "street" ? "Example: Ajufo Street" : "Example: Ofili Close"}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </label>
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="inline-flex items-center gap-2 rounded-2xl bg-primary/100 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
 >
 {loading ? <LoadingSpinner className="h-5 w-5" /> : <Save className="h-5 w-5" />}

 {loading ? "Creating..." : "Create Resident"}
 </button>
 </form>
 </div>
 </div>

 <SuccessDialog
 open={dialogOpen}
 onClose={handleDialogClose}
 title="Resident Created"
 description="The resident account has been created successfully."
 fullName={createdResident?.fullName ?? ""}
 email={createdResident?.email ?? ""}
 password={createdResident?.password ?? ""}
 phone={createdResident?.phone}
 accountLabel="resident account"
 />
 </AppShell>
 );
}
