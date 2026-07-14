"use client";

import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";

import SettingsSection from "@/app/components/profile/SettingsSection";
import ProfileField from "@/app/components/profile/ProfileField";
import ChangePasswordCard from "@/app/components/profile/ChangePasswordCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ResidentProfile {
 full_name: string;
 email: string;
 phone: string;
 house_number: string;
 street: string;
}

export default function SettingsPage() {
 const [resident, setResident] = useState<ResidentProfile | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let isMounted = true;

 async function loadResident() {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 if (isMounted) setLoading(false);
 return;
 }

 const { data, error } = await supabase
 .from("residents")
 .select(
 `
 full_name,
 email,
 phone,
 house_number,
 street
 `,
 )
 .eq("user_id", user.id)
 .single();

 if (!isMounted) return;

 if (!error && data) {
 setResident(data);
 }

 setLoading(false);
 }

 void loadResident();

 return () => {
 isMounted = false;
 };
 }, []);

 return (
 <main className="min-h-screen bg-background px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-foreground">
 <div className="mx-auto flex w-full max-w-md lg:max-w-3xl flex-col gap-6">
 <header>
 <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
 <p className="mt-2 text-sm text-muted-foreground">
 Manage your account and resident preferences
 </p>
 </header>

 {loading && (
 <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
 Loading settings...
 </div>
 )}

 {!loading && (
 <>
 <SettingsSection title="Profile Information">
 <ProfileField label="Full Name" value={resident?.full_name ?? "-"} />

 <ProfileField label="Email Address" value={resident?.email ?? "-"} />

 <ProfileField label="Phone Number" value={resident?.phone ?? "-"} />
 </SettingsSection>
 <SettingsSection title="Residence Details">
 <ProfileField
 label="House Number"
 value={resident?.house_number ?? "-"}
 />

 <ProfileField label="Street" value={resident?.street ?? "-"} />

 <ProfileField label="Estate" value="Thomas Ajufo Estate" />
 </SettingsSection>


 <ChangePasswordCard />

 
 <Link
 href="/update-password"
 className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 Update password
 </Link>
 </>
 )}
 </div>
 <ResidentBottomNav />
 </main>
 );
}
