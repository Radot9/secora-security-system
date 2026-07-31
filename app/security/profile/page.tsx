"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, IdCard, MapPin, ShieldCheck } from "lucide-react";

import ChangePasswordCard from "@/app/components/profile/ChangePasswordCard";
import ProfileCard from "@/app/components/profile/ProfileCard";
import ProfileField from "@/app/components/profile/ProfileField";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";

type SecurityProfile = {
 full_name: string | null;
 email: string | null;
 phone: string | null;
 gate: string | null;
 team: string | null;
};

export default function SecurityProfilePage() {
 const [profile, setProfile] = useState<SecurityProfile | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let mounted = true;

 async function loadProfile() {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 if (mounted) setLoading(false);
 return;
 }

 const { data } = await supabase
 .from("security_personnel")
 .select("full_name, email, phone, gate, team")
 .eq("user_id", user.id)
 .maybeSingle();

 if (!mounted) return;
 setProfile(data);
 setLoading(false);
 }

 void loadProfile();
 return () => {
 mounted = false;
 };
 }, []);

 return (
 <AppShell size="wide">
 <div className="space-y-8">
 <div className="flex items-center gap-3">
 <Link
 href="/security"
 aria-label="Back to security dashboard"
 className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:bg-muted"
 >
 <ArrowLeft className="h-5 w-5" />
 </Link>
 <PageHeader title="Security Profile" subtitle="Review your duty assignment and manage your password." />
 </div>

 {loading ? (
 <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
 Loading profile...
 </div>
 ) : (
 <>
 <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
 <ProfileCard title="Personal Information">
 <ProfileField label="Full Name" value={profile?.full_name ?? "-"} />
 <ProfileField label="Email Address" value={profile?.email ?? "-"} />
 <ProfileField label="Phone Number" value={profile?.phone ?? "-"} />
 </ProfileCard>

 <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
 <div className="flex items-center gap-3">
 <ShieldCheck className="h-6 w-6 text-primary" />
 <h2 className="text-lg font-bold">Duty Assignment</h2>
 </div>
 <div className="mt-6 space-y-5">
 <div className="flex items-start gap-3 rounded-2xl bg-background p-4">
 <MapPin className="mt-0.5 h-5 w-5 text-primary" />
 <div>
 <p className="text-sm text-muted-foreground">Assigned Gate</p>
 <p className="mt-1 font-semibold">{profile?.gate || "Not assigned"}</p>
 </div>
 </div>
 <div className="flex items-start gap-3 rounded-2xl bg-background p-4">
 <IdCard className="mt-0.5 h-5 w-5 text-primary" />
 <div>
 <p className="text-sm text-muted-foreground">Security Team</p>
 <p className="mt-1 font-semibold">{profile?.team || "Not assigned"}</p>
 </div>
 </div>
 </div>
 </div>
 </section>

 <div id="password" className="scroll-mt-8">
 <ChangePasswordCard />
 </div>
 </>
 )}
 </div>
 </AppShell>
 );
}
