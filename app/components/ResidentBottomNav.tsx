'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
 {
 label: "Dashboard",
 href: "/residents",
 icon: (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M4 11.5 12 5l8 6.5" />
 <path d="M6.5 10.5V19h11v-8.5" />
 </svg>
 ),
 },
 {
 label: "Visitors",
 href: "/residents/visitors",
 icon: (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
 <circle cx="9" cy="8" r="3" />
 <path d="M3.5 19c.7-3.4 2.6-5 5.5-5s4.8 1.6 5.5 5" />
 <circle cx="17" cy="9" r="2.5" />
 <path d="M15.5 14.5c2.4.2 4 1.7 4.8 4.5" />
 </svg>
 ),
 },
 {
 label: "Add",
 href: "/residents/generate-code",
 icon: (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M12 5v14M5 12h14" />
 </svg>
 ),
 },
 {
 label: "Activity",
 href: "/residents/activity",
 icon: (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M5 12h3l2-5 4 10 2-5h3" />
 <path d="M4 19h16" />
 </svg>
 ),
 },
 {
 label: "Settings",
 href: "/residents/settings",
 icon: (
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
 <circle cx="12" cy="12" r="3" />
 <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.7a7.8 7.8 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7.8 7.8 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
 </svg>
 ),
 },
];

export function ResidentBottomNav() {
 const pathname = usePathname();
 const [isSidebarOpen, setIsSidebarOpen] = useState(true);

 const renderItems = (variant: "bottom" | "sidebar") =>
 items.map((item) => {
 const isActive =
 item.href === "/residents"
 ? pathname === item.href
 : pathname.startsWith(item.href);

 return (
 <Link
 key={item.href}
 href={item.href}
 className={
 variant === "bottom"
 ? `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-ring ${
 isActive
 ? "bg-primary/10 text-primary"
 : "text-muted-foreground hover:bg-muted hover:text-foreground"
 }`
 : `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ring ${
 isActive
 ? "bg-primary/10 text-primary"
 : "text-muted-foreground hover:bg-muted hover:text-foreground"
 }`
 }
 >
 {item.icon}
 <span>{item.label}</span>
 </Link>
 );
 });

 return (
 <>
 <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-3 pb-4 pt-2 shadow-lg shadow-border/60 backdrop-blur lg:hidden">
 <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
 {renderItems("bottom")}
 </div>
 </nav>

 {!isSidebarOpen && (
 <button
 type="button"
 aria-label="Open resident menu"
 onClick={() => setIsSidebarOpen(true)}
 className="fixed left-5 top-5 z-50 hidden h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring lg:flex"
 >
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M4 7h16M4 12h16M4 17h16" />
 </svg>
 </button>
 )}

 {isSidebarOpen && (
 <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-72 flex-col border-r border-border bg-card px-5 py-6 shadow-xl shadow-border/50 lg:flex">
 <div className="flex items-center justify-between gap-4">
 <Link href="/residents" className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
 S
 </div>
 <div>
 <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
 Security
 </p>
 <p className="text-xs font-semibold tracking-[0.32em] text-muted-foreground">
 System
 </p>
 </div>
 </Link>
 <button
 type="button"
 aria-label="Close resident menu"
 onClick={() => setIsSidebarOpen(false)}
 className="flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M6 6l12 12M18 6 6 18" />
 </svg>
 </button>
 </div>

 <div className="mt-10 flex flex-1 flex-col gap-2">
 {renderItems("sidebar")}
 </div>
 </aside>
 )}
 </>
 );
}
