"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";

export default function EstateSettingsPage() {
 const [estateName, setEstateName] = useState("Thomas Ajufo Estate");
 const [defaultPassHours, setDefaultPassHours] = useState(24);
 const [requirePlateNumber, setRequirePlateNumber] = useState(false);
 const [allowResidentRevocation, setAllowResidentRevocation] = useState(true);

 function handleSave(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault();
 toast.success("Settings saved for this session.");
 }

 return (
 <AppShell size="default">
 <div className="flex flex-col gap-6">
 <PageHeader
 title="Estate Settings"
 subtitle="Review operational access defaults for the estate"
 backHref="/admin"
 />

 <Card>
 <form className="flex flex-col gap-6" onSubmit={handleSave}>
 <div>
 <label className="mb-2 block text-sm font-medium">
 Estate name
 </label>
 <input
 value={estateName}
 onChange={(event) => setEstateName(event.target.value)}
 className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium">
 Default visitor pass duration
 </label>
 <div className="flex items-center gap-3">
 <input
 type="number"
 min={1}
 max={168}
 value={defaultPassHours}
 onChange={(event) =>
 setDefaultPassHours(Number(event.target.value))
 }
 className="w-32 rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 <span className="text-sm text-muted-foreground">hours</span>
 </div>
 </div>

 <label className="flex items-start gap-3 rounded-2xl border border-border p-4">
 <input
 type="checkbox"
 checked={requirePlateNumber}
 onChange={(event) => setRequirePlateNumber(event.target.checked)}
 className="mt-1 h-4 w-4 accent-primary"
 />
 <span>
 <span className="block font-medium">Require plate number</span>
 <span className="mt-1 block text-sm text-muted-foreground">
 Ask residents to provide a vehicle plate number before issuing
 visitor passes.
 </span>
 </span>
 </label>

 <label className="flex items-start gap-3 rounded-2xl border border-border p-4">
 <input
 type="checkbox"
 checked={allowResidentRevocation}
 onChange={(event) =>
 setAllowResidentRevocation(event.target.checked)
 }
 className="mt-1 h-4 w-4 accent-primary"
 />
 <span>
 <span className="block font-medium">
 Allow resident revocation
 </span>
 <span className="mt-1 block text-sm text-muted-foreground">
 Residents can revoke a pending visitor pass before check-in.
 </span>
 </span>
 </label>

 <button
 type="submit"
 className="inline-flex w-fit items-center justify-center rounded-2xl bg-primary/100 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary"
 >
 Save Settings
 </button>
 </form>
 </Card>
 </div>
 </AppShell>
 );
}
