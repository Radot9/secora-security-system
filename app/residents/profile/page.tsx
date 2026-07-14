"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import ProfileCard from "@/app/components/profile/ProfileCard";
import ProfileField from "@/app/components/profile/ProfileField";
import ChangePasswordCard from "@/app/components/profile/ChangePasswordCard";

interface ResidentProfile {
 full_name: string;
 email: string;
 phone: string;
 house_number: string;
 street: string;
}

export default function ResidentProfilePage() {
 const [resident, setResident] = useState<ResidentProfile | null>(null);

 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let isMounted = true;

 async function loadProfile() {
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

 void loadProfile();

 return () => {
 isMounted = false;
 };
 }, []);

 if (loading) {
 return (
 <AppShell>
 <div className="py-20 text-center">
 Loading profile...
 </div>
 </AppShell>
 );
 }

 return (
 <AppShell size="default">
 <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">

 <PageHeader
 title="My Profile"
 subtitle="Manage your personal information"
 />

 <ProfileCard title="Personal Information">

 <ProfileField
 label="Full Name"
 value={resident?.full_name ?? "-"}
 />

 <ProfileField
 label="Email Address"
 value={resident?.email ?? "-"}
 />

 <ProfileField
 label="Phone Number"
 value={resident?.phone ?? "-"}
 />

 <ProfileField
 label="House Number"
 value={resident?.house_number ?? "-"}
 />

 <ProfileField
 label="Street"
 value={resident?.street ?? "-"}
 />

 </ProfileCard>

 <ChangePasswordCard />

 </div>
 </AppShell>
 );
}
