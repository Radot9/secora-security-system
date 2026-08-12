"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, Megaphone, ShieldAlert, Sparkles, Wrench } from "lucide-react";

import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/types/community";
import { ANNOUNCEMENTS_READ_EVENT } from "@/app/components/AnnouncementNavIcon";

const categoryConfig = {
 community: { label: "Community", icon: Megaphone, tone: "text-primary bg-primary/10" },
 security: { label: "Security", icon: ShieldAlert, tone: "text-amber-600 bg-amber-500/10" },
 maintenance: { label: "Maintenance", icon: Wrench, tone: "text-blue-500 bg-blue-500/10" },
 event: { label: "Event", icon: Sparkles, tone: "text-violet-500 bg-violet-500/10" },
} as const;

function formatDate(value: string) {
 return new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function AnnouncementsPage() {
 const [announcements, setAnnouncements] = useState<Announcement[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let active = true;

 async function loadAnnouncements() {
 const [{ data }, { data: authData }] = await Promise.all([
 supabase
 .from("announcements")
 .select("id, title, body, category, published_at")
 .eq("is_published", true)
 .order("published_at", { ascending: false }),
 supabase.auth.getUser(),
 ]);

 if (authData.user) {
 const { error } = await supabase.from("announcement_read_state").upsert({
 user_id: authData.user.id,
 last_read_at: new Date().toISOString(),
 }, { onConflict: "user_id" });
 if (!error) window.dispatchEvent(new Event(ANNOUNCEMENTS_READ_EVENT));
 }

 if (active) {
 setAnnouncements((data as Announcement[] | null) ?? []);
 setLoading(false);
 }
 }

 void loadAnnouncements();
 return () => { active = false; };
 }, []);

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <PageHeader title="Announcements" subtitle="Important estate news, maintenance notices, events, and security updates." />

 {loading ? (
 <Card><p className="py-12 text-center text-sm text-muted-foreground">Loading announcements...</p></Card>
 ) : announcements.length === 0 ? (
 <Card className="flex flex-col items-center py-14 text-center">
 <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-7 w-7" /></span>
 <h2 className="mt-5 text-lg font-bold">You&apos;re all caught up</h2>
 <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">New community and security notices will appear here when they are published.</p>
 </Card>
 ) : (
 <section className="grid gap-5 xl:grid-cols-2">
 {announcements.map((announcement) => {
 const config = categoryConfig[announcement.category];
 const Icon = config.icon;
 return (
 <Card key={announcement.id}>
 <div className="flex items-start gap-4">
 <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.tone}`}><Icon className="h-5 w-5" /></span>
 <div className="min-w-0 flex-1">
 <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{config.label}</span>
 <h2 className="mt-2 text-xl font-bold tracking-tight">{announcement.title}</h2>
 <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{announcement.body}</p>
 <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{formatDate(announcement.published_at)}</p>
 </div>
 </div>
 </Card>
 );
 })}
 </section>
 )}
 </div>
 </AppShell>
 );
}
