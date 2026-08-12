"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import ProfileCard from "@/app/components/profile/ProfileCard";
import ProfileField from "@/app/components/profile/ProfileField";
import { formatResidentLocation } from "@/lib/resident-address";

interface ResidentProfile {
 full_name: string;
 email: string;
 phone: string;
 house_number: string;
 street: string | null;
 close: string | null;
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
 street,
 close
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
 <AppShell size="full" residentSidebar>
 <div className="py-20 text-center">
 Loading profile...
 </div>
 </AppShell>
 );
 }

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">

 <PageHeader
 title="My Profile"
 subtitle="Review your personal and residence information"
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

 <ProfileField label="Location Type" value={resident?.close ? "Close" : "Street"} />
 <ProfileField label={resident?.close ? "Close Name" : "Street Name"} value={resident ? formatResidentLocation(resident) : "-"} />

 </ProfileCard>

 </div>
 </AppShell>
 );
}
