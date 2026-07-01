"use client";

import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";

import SettingsSection from "@/app/components/profile/SettingsSection";
import ProfileField from "@/app/components/profile/ProfileField";
import ChangePasswordCard from "@/app/components/profile/ChangePasswordCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const settings = [
  "Profile information",
  "Residence details",
  "Notification preferences",
  "Security and password",
];

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
    loadResident();
  }, []);

  async function loadResident() {
    setLoading(true);

    // Ask Supabase who is currently logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If nobody is logged in, stop here
    if (!user) {
      setLoading(false);
      return;
    }

    // Look up the resident using the logged-in user's ID
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

    // If we successfully found the resident,
    // save the information in React state.
    if (!error && data) {
      setResident(data);
    }

    // We have finished loading.
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Manage your account and resident preferences
          </p>
        </header>

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
          className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Update password
        </Link>
      </div>
      <ResidentBottomNav />
    </main>
  );
}
