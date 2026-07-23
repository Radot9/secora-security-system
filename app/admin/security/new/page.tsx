"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { toast } from "sonner";
import { generatePassword } from "@/lib/utils/generatePassword";
import SuccessDialog from "@/app/components/ui/SuccessDialog";

export default function NewResidentPage() {
 const [loading, setLoading] = useState(false);

 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [gate, setGate] = useState("");
 const [team, setTeam] = useState("");
 const [password, setPassword] = useState(() => generatePassword());

 const [dialogOpen, setDialogOpen] = useState(false);

 const [createdOfficer, setCreatedOfficer] = useState<{
 fullName: string;
 email: string;
 phone: string;
 password: string;
 } | null>(null);

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();

 setLoading(true);

 try {
 const response = await fetch("/api/admin/create-security", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 fullName,
 email,
 password,
 phone,
 gate,
 team,
 }),
 });

 const result = await response.json();

 if (!response.ok) {
 if (result.error?.toLowerCase().includes("already")) {
 toast.warning("A security officer with this email address already exists.");
 } else {
 toast.error(result.error);
 }

 return;
 }

 setCreatedOfficer({
 fullName,
 email,
 phone,
 password,
 });

 setDialogOpen(true);
 } catch {
 toast.error("Unable to create security officer.");
 } finally {
 setLoading(false);
 }
 }

 function handleDialogClose() {
 setDialogOpen(false);

 setFullName("");
 setEmail("");
 setPhone("");

 setGate("");
 setTeam("");

 setPassword(generatePassword());

 setCreatedOfficer(null);
 }

 return (
 <AppShell size="default">
 <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
 <PageHeader
 title="Add Security Officer"
 subtitle="Create a new security personnel account"
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

 <div>
 <label className="mb-2 block text-sm font-medium">
 Gate Assignment
 </label>

 <select
 value={gate}
 onChange={(e) => setGate(e.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 >
 <option value="">Select Gate</option>

 <option value="Main Gate">Main Gate</option>

 <option value="Small Gate">Small Gate</option>
 </select>
 </div>

 <div className="mt-6">
 <label className="mb-2 block text-sm font-medium">
 Duty Team
 </label>

 <select
 value={team}
 onChange={(e) => setTeam(e.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
 >
 <option value="">Select Team</option>

 <option value="Team A">Team A</option>

 <option value="Team B">Team B</option>
 </select>
 </div>
 <button
 type="submit"
 disabled={loading}
 className="inline-flex items-center gap-2 rounded-2xl bg-primary/100 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
 >
 <Save className="h-5 w-5" />

 {loading ? "Creating..." : "Create Security Officer"}
 </button>
 </form>
 </div>
 </div>

 <SuccessDialog
 open={dialogOpen}
 onClose={handleDialogClose}
 title="Security Officer Created"
 description="The security officer account has been created successfully."
 fullName={createdOfficer?.fullName ?? ""}
 email={createdOfficer?.email ?? ""}
 password={createdOfficer?.password ?? ""}
 phone={createdOfficer?.phone}
 />
 </AppShell>
 );
}
