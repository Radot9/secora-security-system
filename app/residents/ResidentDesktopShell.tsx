"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 Activity,
 ArrowLeft,
 ChevronRight,
 Home,
 LogOut,
 QrCode,
 Settings,
 UserPlus,
 UsersRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { BrandMark } from "@/app/components/ui/BrandMark";

type ResidentDesktopShellProps = {
 children: ReactNode;
 displayName: string;
 email: string;
 initials: string;
};

const navigationGroups = [
 {
 label: "Overview",
 items: [{ label: "Dashboard", href: "/residents", icon: Home }],
 },
 {
 label: "Visitor access",
 items: [
 { label: "Add Visitor", href: "/residents/generate-code", icon: UserPlus },
 { label: "Visitor Passes", href: "/residents/visitors", icon: UsersRound },
 { label: "Latest Access Code", href: "/residents/access-code", icon: QrCode },
 { label: "Activity", href: "/residents/activity", icon: Activity },
 ],
 },
 {
 label: "Account",
 items: [
 { label: "My Profile", href: "/residents/profile", icon: UsersRound },
 { label: "Settings", href: "/residents/settings", icon: Settings },
 ],
 },
];

const pageNames: Record<string, string> = {
 "/residents": "Dashboard",
 "/residents/generate-code": "Add Visitor",
 "/residents/visitors": "Visitor Passes",
 "/residents/access-code": "Access Code",
 "/residents/activity": "Activity",
 "/residents/profile": "My Profile",
 "/residents/settings": "Settings",
};

function isActivePath(pathname: string, href: string) {
 if (href === "/residents") return pathname === href;
 return pathname === href || pathname.startsWith(`${href}/`);
}

export function ResidentDesktopShell({
 children,
 displayName,
 email,
 initials,
}: ResidentDesktopShellProps) {
 const pathname = usePathname();
 const router = useRouter();
 const currentPage = pageNames[pathname] ?? "Resident";

 async function handleLogout() {
 await supabase.auth.signOut();
 router.replace("/");
 router.refresh();
 }

 return (
 <div className="min-h-screen bg-background text-foreground">
 <aside className="app-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
 <div className="flex h-20 items-center border-b border-sidebar-border px-5">
 <Link href="/residents" className="flex items-center gap-3">
 <BrandMark size="small" />
 <span>
 <span className="block text-base font-bold tracking-[-0.02em]">Secora</span>
 <span className="block text-xs text-muted-foreground">Resident Portal</span>
 </span>
 </Link>
 </div>

 <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Resident navigation">
 {navigationGroups.map((group) => (
 <div key={group.label}>
 <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
 {group.label}
 </p>
 <div className="space-y-1">
 {group.items.map((item) => {
 const Icon = item.icon;
 const active = isActivePath(pathname, item.href);
 return (
 <Link
 key={item.href}
 href={item.href}
 aria-current={active ? "page" : undefined}
 data-active={active}
 className="app-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground"
 >
 <Icon className="h-5 w-5 shrink-0" />
 {item.label}
 </Link>
 );
 })}
 </div>
 </div>
 ))}
 </nav>

 <div className="border-t border-sidebar-border p-3">
 <Link
 href="/residents/profile"
 className="app-nav-link flex items-center gap-3 rounded-xl p-3"
 >
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
 {initials}
 </span>
 <span className="min-w-0 flex-1">
 <span className="block truncate text-sm font-semibold">{displayName}</span>
 <span className="block truncate text-xs text-muted-foreground">Resident</span>
 </span>
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 </Link>
 </div>
 </aside>

 <div className="lg:pl-72">
 <header className="app-toolbar sticky top-0 z-30 hidden px-6 py-3 lg:block">
 <div className="flex min-h-12 items-center justify-between gap-3">
 <div className="flex min-w-0 items-center gap-2">
 {pathname !== "/residents" && (
 <button
 type="button"
 onClick={() => router.back()}
 aria-label="Go back to previous page"
 className="apple-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border"
 >
 <ArrowLeft className="h-5 w-5" />
 </button>
 )}
 <div className="min-w-0">
 <p className="truncate text-base font-bold">{currentPage}</p>
 <p className="text-xs text-muted-foreground">
 Resident <span aria-hidden="true">/</span> {currentPage}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Link
 href="/residents/profile"
 className="app-nav-link flex min-w-0 items-center gap-3 rounded-xl px-3 py-2"
 aria-label="Open resident profile"
 >
 <span className="min-w-0 text-right">
 <span className="block max-w-40 truncate text-sm font-semibold">{displayName}</span>
 <span className="block max-w-48 truncate text-xs text-muted-foreground">{email}</span>
 </span>
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
 {initials}
 </span>
 </Link>
 <button
 type="button"
 onClick={handleLogout}
 className="apple-secondary-button flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:border-destructive/40 hover:text-destructive"
 >
 <LogOut className="h-5 w-5" />
 <span className="hidden xl:inline">Logout</span>
 </button>
 </div>
 </div>
 </header>

 <div className="resident-content">{children}</div>
 </div>
 </div>
 );
}
