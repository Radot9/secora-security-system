"use client";

import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";
import { StatusBadge } from "@/app/components/ui/StatusBadge";

export default function ActivityPage() {
 const [visitors, setVisitors] = useState<Visitor[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let isMounted = true;

 async function loadActivity() {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 if (isMounted) setLoading(false);
 return;
 }

 const { data: resident } = await supabase
 .from("residents")
 .select("id")
 .eq("user_id", user.id)
 .single();

 if (!resident) {
 if (isMounted) setLoading(false);
 return;
 }

 const { data, error } = await supabase
 .from("visitors")
 .select("*")
 .eq("resident_id", resident.id)
 .order("created_at", { ascending: false })
 .limit(50);

 if (!isMounted) return;

 if (!error && data) {
 setVisitors(data);
 }

 setLoading(false);
 }

 void loadActivity();

 return () => {
 isMounted = false;
 };
 }, []);

 const activityItems = useMemo(() => {
 return visitors.flatMap((visitor) => {
 const items = [
 {
 id: `${visitor.id}-created`,
 visitor,
 label: "Pass generated",
 time: visitor.created_at,
 status: visitor.status,
 },
 ];

 if (visitor.entry_time) {
 items.push({
 id: `${visitor.id}-entered`,
 visitor,
 label: "Checked in",
 time: visitor.entry_time,
 status: "entered",
 });
 }

 if (visitor.exit_time) {
 items.push({
 id: `${visitor.id}-exited`,
 visitor,
 label: "Checked out",
 time: visitor.exit_time,
 status: "exited",
 });
 }

 return items;
 });
 }, [visitors]);

 return (
 <main className="min-h-screen bg-background px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-foreground">
 <div className="flex flex-col gap-6">
 <PageHeader
 title="Activity Logs"
 subtitle="Recent visitor movements for your residence"
 />

 <Card>
 {loading ? (
 <p className="py-12 text-center text-sm text-muted-foreground">
 Loading activity...
 </p>
 ) : activityItems.length === 0 ? (
 <div className="py-12 text-center">
 <h2 className="font-semibold">No activity yet</h2>
 <p className="mt-2 text-sm text-muted-foreground">
 Visitor activity will appear after you generate a pass.
 </p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {activityItems.map((item) => (
 <article
 key={item.id}
 className="flex items-center gap-4 px-5 py-5"
 >
 <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
 <Clock3 className="h-5 w-5" />
 </span>
 <div className="min-w-0 flex-1">
 <h2 className="font-semibold">
 {item.visitor.visitor_name}
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 {item.label} at {new Date(item.time).toLocaleString()}
 </p>
 </div>
 <StatusBadge status={item.status} />
 </article>
 ))}
 </div>
 )}
 </Card>
 </div>
 <ResidentBottomNav />
 </main>
 );
}
