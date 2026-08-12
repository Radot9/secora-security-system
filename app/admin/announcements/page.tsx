"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarDays, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/types/community";

type AnnouncementCategory = Announcement["category"];

const categories: { value: AnnouncementCategory; label: string }[] = [
 { value: "community", label: "Community" },
 { value: "security", label: "Security" },
 { value: "maintenance", label: "Maintenance" },
 { value: "event", label: "Event" },
];

function formatDate(value: string) {
 return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminAnnouncementsPage() {
 const [announcements, setAnnouncements] = useState<Announcement[]>([]);
 const [title, setTitle] = useState("");
 const [body, setBody] = useState("");
 const [category, setCategory] = useState<AnnouncementCategory>("community");
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 const loadAnnouncements = useCallback(async () => {
 const { data, error } = await supabase
 .from("announcements")
 .select("id, title, body, category, published_at")
 .eq("is_published", true)
 .order("published_at", { ascending: false });
 if (error) toast.error(`Unable to load announcements: ${error.message}`);
 setAnnouncements((data as Announcement[] | null) ?? []);
 setLoading(false);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadAnnouncements(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadAnnouncements]);

 async function publishAnnouncement() {
 if (title.trim().length < 3 || body.trim().length < 3) {
 toast.error("Add a title and message before publishing.");
 return;
 }

 setSubmitting(true);
 const { data: authData } = await supabase.auth.getUser();
 if (!authData.user) {
 toast.error("Your session has expired. Please sign in again.");
 setSubmitting(false);
 return;
 }

 const { error } = await supabase.from("announcements").insert({
 title: title.trim(),
 body: body.trim(),
 category,
 created_by: authData.user.id,
 is_published: true,
 });
 setSubmitting(false);

 if (error) {
 toast.error(`Unable to publish announcement: ${error.message}`);
 return;
 }

 setTitle("");
 setBody("");
 setCategory("community");
 toast.success("Announcement published.");
 await loadAnnouncements();
 }

 async function deleteAnnouncement(id: string) {
 const { error } = await supabase.from("announcements").delete().eq("id", id);
 if (error) {
 toast.error(`Unable to remove announcement: ${error.message}`);
 return;
 }
 toast.success("Announcement removed.");
 await loadAnnouncements();
 }

 return (
 <AppShell size="wide">
 <div className="space-y-8">
 <PageHeader title="Announcements" subtitle="Publish estate notices that residents will see on their dashboard and announcements page." />

 <section className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
 <Card>
 <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold">New announcement</h2></div>
 <div className="mt-6 grid gap-4">
 <label className="grid gap-2 text-sm font-semibold">Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Example: Water maintenance" className="apple-input rounded-2xl border border-border px-4 py-3 text-sm outline-none" /></label>
 <label className="grid gap-2 text-sm font-semibold">Category<select value={category} onChange={(event) => setCategory(event.target.value as AnnouncementCategory)} className="apple-input rounded-2xl border border-border px-4 py-3 text-sm outline-none">{categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
 <label className="grid gap-2 text-sm font-semibold">Message<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={7} placeholder="Write the full announcement..." className="apple-input resize-none rounded-2xl border border-border px-4 py-3 text-sm outline-none" /></label>
 <button type="button" onClick={() => void publishAnnouncement()} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"><Send className="h-4 w-4" />{submitting ? "Publishing..." : "Publish announcement"}</button>
 </div>
 </Card>

 <Card className="p-0">
 <div className="border-b border-border p-6"><h2 className="text-lg font-bold">Published announcements</h2><p className="mt-1 text-sm text-muted-foreground">Residents receive a new-notice indicator for every announcement published after their last visit.</p></div>
 {loading ? <p className="p-6 text-sm text-muted-foreground">Loading announcements...</p> : announcements.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No announcements have been published yet.</p> : <div className="divide-y divide-border">{announcements.map((announcement) => <article key={announcement.id} className="flex items-start gap-4 p-6"><div className="min-w-0 flex-1"><span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{announcement.category}</span><h3 className="mt-2 font-bold">{announcement.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.body}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{formatDate(announcement.published_at)}</p></div><button type="button" onClick={() => void deleteAnnouncement(announcement.id)} aria-label={`Delete ${announcement.title}`} className="apple-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-destructive"><Trash2 className="h-4 w-4" /></button></article>)}</div>}
 </Card>
 </section>
 </div>
 </AppShell>
 );
}
