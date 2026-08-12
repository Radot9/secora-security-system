"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { supabase } from "@/lib/supabase";

export const ANNOUNCEMENTS_READ_EVENT = "entriseq:announcements-read";

type AnnouncementNavIconProps = {
 className?: string;
};

export function AnnouncementNavIcon({ className = "h-5 w-5" }: AnnouncementNavIconProps) {
 const [hasUnread, setHasUnread] = useState(false);

 const loadUnreadState = useCallback(async () => {
 const { data: authData } = await supabase.auth.getUser();
 const user = authData.user;
 if (!user) return;

 const { data: readState } = await supabase
 .from("announcement_read_state")
 .select("last_read_at")
 .eq("user_id", user.id)
 .maybeSingle();

 let query = supabase
 .from("announcements")
 .select("id", { count: "exact", head: true })
 .eq("is_published", true);

 if (readState?.last_read_at) query = query.gt("published_at", readState.last_read_at);

 const { count, error } = await query;
 if (!error) setHasUnread((count ?? 0) > 0);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadUnreadState(), 0);
 const markRead = () => setHasUnread(false);
 window.addEventListener(ANNOUNCEMENTS_READ_EVENT, markRead);
 return () => {
 window.clearTimeout(timeoutId);
 window.removeEventListener(ANNOUNCEMENTS_READ_EVENT, markRead);
 };
 }, [loadUnreadState]);

 return (
 <span className="relative inline-flex shrink-0" aria-label={hasUnread ? "New announcements" : undefined}>
 <Bell className={className} />
 {hasUnread ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-amber-400" aria-hidden="true" /> : null}
 </span>
 );
}
