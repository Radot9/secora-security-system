'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

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

 return (
 <nav className="app-bottom-bar fixed inset-x-0 bottom-0 z-50 px-3 pt-2 lg:hidden">
 <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
 {items.map((item) => {
 const isActive =
 item.href === "/residents"
 ? pathname === item.href
 : pathname.startsWith(item.href);

 return (
 <Link
 key={item.href}
 href={item.href}
 data-active={isActive}
 className="app-tab-link flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium text-muted-foreground"
 >
 <span className="flex h-5 w-5 shrink-0 items-center justify-center">
 {item.icon}
 </span>
 <span>{item.label}</span>
 </Link>
 );
 })}
 </div>
 </nav>
 );
}
