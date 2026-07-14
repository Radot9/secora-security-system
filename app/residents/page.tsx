"use client";


import { ResidentBottomNav } from "../components/ResidentBottomNav";
import { AppShell } from "../components/ui/AppShell";
import { Card } from "../components/ui/Card";
import { PageSection } from "../components/ui/PageSection";

import { CardSection } from "../components/ui/CardSection";
import { UserPlus, QrCode } from "lucide-react";
import { ActionCard } from "../components/ui/ActionCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";

const quickActions = [
 {
 title: "Add Visitor",
 href: "/residents/generate-code",
 description: "Create and share a visitor access code",
 icon: <UserPlus className="h-6 w-6" />,
 },
 {
 title: "Access Codes",
 href: "/residents/access-code",
 description: "View the latest generated visitor pass",
 icon: <QrCode className="h-6 w-6" />,
 },
];

export default function ResidentsPage() {
 const [visitors, setVisitors] = useState<Visitor[]>([]);
 const [loading, setLoading] = useState(true);

 // Logged-in resident information
 const [resident, setResident] = useState<{
 id: string;
 full_name: string;
 house_number: string;
 street: string;
 } | null>(null);

 useEffect(() => {
 let isMounted = true;

 async function loadDashboard() {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 if (isMounted) setLoading(false);
 return;
 }

 const { data: residentData, error: residentError } = await supabase
 .from("residents")
 .select("id, full_name, house_number, street")
 .eq("user_id", user.id)
 .single();

 if (!isMounted) return;

 if (residentError || !residentData) {
 setLoading(false);
 return;
 }

 setResident(residentData);

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("resident_id", residentData.id)
 .order("created_at", { ascending: false })
 .limit(3);

 if (!isMounted) return;

 if (!error && data) {
 setVisitors(data);
 }

 setLoading(false);
 }

 void loadDashboard();

 return () => {
 isMounted = false;
 };
 }, []);

 return (
 <AppShell size="default">
 <div className="flex flex-col gap-8">
 <header className="flex items-center gap-3">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary shadow-sm shadow-primary/10">
 {resident?.full_name
 ?.split(" ")
 .map((name) => name[0])
 .join("")
 .slice(0, 2)
 .toUpperCase() ?? "R"}
 </div>
 <div className="min-w-0">
 <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
 Welcome {resident?.full_name ?? "Resident"}
 </h1>
 <p className="mt-1 truncate text-sm text-muted-foreground">
 {resident
 ? `${resident.house_number}, ${resident.street}, Thomas Ajufo Estate`
 : "Thomas Ajufo Estate"}
 </p>
 </div>
 </header>

 <Card className="border-0 bg-primary/10">
 <PageSection spacing="md">
 <p className="text-sm font-medium text-primary">
 Resident Portal
 </p>

 <div>
 <h2 className="text-2xl font-bold tracking-tight">
 Manage your estate visitors
 </h2>

 <p className="mt-3 text-sm leading-6 text-muted-foreground">
 Add expected visitors, share access codes, and keep track of who
 has checked in or out.
 </p>
 </div>
 </PageSection>
 </Card>

 {/* Quick Actions */}

 <section className="grid gap-4 lg:grid-cols-2">
 {quickActions.map((action) => (
 <ActionCard
 key={action.title}
 title={action.title}
 description={action.description}
 href={action.href}
 icon={action.icon}
 />
 ))}
 </section>

 <CardSection
 title="Recent Visitors"
 actionLabel="View all"
 actionHref="/residents/visitors"
 >
 <div className="divide-y divide-border">
 {loading ? (
 <p className="px-8 py-6 text-sm text-muted-foreground">
 Loading visitors...
 </p>
 ) : visitors.length === 0 ? (
 <p className="px-8 py-6 text-sm text-muted-foreground">
 No visitors created yet.
 </p>
 ) : (
 visitors.slice(0, 3).map((visitor) => (
 <article
 key={visitor.id}
 className="flex items-start justify-between px-8 py-5"
 >
 <div>
 <h3 className="font-semibold">{visitor.visitor_name}</h3>

 <p className="mt-1 text-sm text-muted-foreground">
 {visitor.visitor_phone}
 </p>
 </div>

 <time className="text-sm text-muted-foreground">
 {visitor.entry_time
 ? new Date(visitor.entry_time).toLocaleTimeString()
 : "Pending"}
 </time>
 </article>
 ))
 )}
 </div>
 </CardSection>
 </div>
 <ResidentBottomNav />
 </AppShell>
 );
}
