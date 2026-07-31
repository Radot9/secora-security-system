"use client";

import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { AppShell } from "../../components/ui/AppShell";

import ChangePasswordCard from "@/app/components/profile/ChangePasswordCard";

export default function SettingsPage() {
 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <header>
 <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
 <p className="mt-2 text-sm text-muted-foreground">
 Manage your account security
 </p>
 </header>

 <ChangePasswordCard />
 </div>
 <ResidentBottomNav />
 </AppShell>
 );
}
