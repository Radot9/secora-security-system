"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 Activity,
 ArrowLeft,
 BarChart3,
 ChevronRight,
 ClipboardList,
 DoorOpen,
 Home,
 LogOut,
 Menu,
 Settings,
 ShieldCheck,
 UserCog,
 UserPlus,
 UsersRound,
 X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { BrandMark } from "@/app/components/ui/BrandMark";

type AdminNavigationShellProps = {
 children: ReactNode;
 displayName: string;
 email: string;
 roleLabel: string;
 isSuperAdmin: boolean;
 initials: string;
};

type NavigationItem = {
 label: string;
 href: string;
 icon: typeof Home;
};

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
 {
 label: "Overview",
 items: [{ label: "Dashboard", href: "/admin", icon: Home }],
 },
 {
 label: "Access operations",
 items: [
 { label: "Currently Inside", href: "/admin/currently-inside", icon: DoorOpen },
 { label: "Visitor History", href: "/admin/visitor-history", icon: ClipboardList },
 { label: "Access Logs", href: "/admin/access-logs", icon: Activity },
 ],
 },
 {
 label: "People",
 items: [
 { label: "Residents", href: "/admin/residents", icon: UsersRound },
 { label: "Security Personnel", href: "/admin/security", icon: ShieldCheck },
 ],
 },
 {
 label: "Reports",
 items: [{ label: "Analytics", href: "/admin/analytics", icon: BarChart3 }],
 },
];

const pageNames: Record<string, string> = {
 "/admin": "Dashboard",
 "/admin/currently-inside": "Currently Inside",
 "/admin/visitor-history": "Visitor History",
 "/admin/access-logs": "Access Logs",
 "/admin/analytics": "Analytics",
 "/admin/residents": "Residents",
 "/admin/residents/new": "Create Resident",
 "/admin/security": "Security Personnel",
 "/admin/security/new": "Create Security Officer",
 "/admin/settings": "Profile & Settings",
 "/admin/super-admin": "Super Admin",
 "/admin/administrators": "Administrators",
};

function isActivePath(pathname: string, href: string) {
 if (href === "/admin") return pathname === href;
 return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigationShell({
 children,
 displayName,
 email,
 roleLabel,
 isSuperAdmin,
 initials,
}: AdminNavigationShellProps) {
 const pathname = usePathname();
 const router = useRouter();
 const [menuOpen, setMenuOpen] = useState(false);
 const [loggingOut, setLoggingOut] = useState(false);

 const currentPage =
 pageNames[pathname] ??
 (pathname.startsWith("/admin/administrators/") ? "Administrator Details" : "Admin");

 const closeMenu = () => setMenuOpen(false);

 async function handleLogout() {
 setLoggingOut(true);
 await supabase.auth.signOut();
 router.replace("/");
 router.refresh();
 }

 const sidebar = (
 <div className="flex h-full flex-col">
 <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
 <Link href="/admin" onClick={closeMenu} className="flex items-center gap-3">
 <BrandMark size="small" />
 <span>
 <span className="block text-base font-bold tracking-[-0.02em]">Secora</span>
 <span className="block text-xs text-muted-foreground">Administration</span>
 </span>
 </Link>
 <button
 type="button"
 onClick={closeMenu}
 aria-label="Close navigation"
 className="apple-icon-button flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sidebar-accent lg:hidden"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
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
 onClick={closeMenu}
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

 {isSuperAdmin && (
 <div>
 <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
 Administration
 </p>
 <div className="space-y-1">
 <Link
 href="/admin/super-admin"
 onClick={closeMenu}
 data-active={isActivePath(pathname, "/admin/super-admin")}
 className="app-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
 >
 <UserCog className="h-5 w-5" />
 Super Admin
 </Link>
 <Link
 href="/admin/administrators"
 onClick={closeMenu}
 data-active={isActivePath(pathname, "/admin/administrators")}
 className="app-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
 >
 <UserPlus className="h-5 w-5" />
 Administrators
 </Link>
 </div>
 </div>
 )}
 </nav>

 <div className="border-t border-sidebar-border p-3">
 <Link
 href="/admin/settings"
 onClick={closeMenu}
 className="app-nav-link flex items-center gap-3 rounded-xl p-3"
 >
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
 {initials || "A"}
 </span>
 <span className="min-w-0 flex-1">
 <span className="block truncate text-sm font-semibold">{displayName}</span>
 <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
 </span>
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 </Link>
 </div>
 </div>
 );

 return (
 <div className="min-h-screen bg-background text-foreground">
 <aside className="app-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
 {sidebar}
 </aside>

 <div
 className="app-mobile-nav fixed inset-0 z-50 lg:hidden"
 data-open={menuOpen}
 aria-hidden={!menuOpen}
 >
 <button
 type="button"
 aria-label="Close navigation overlay"
 onClick={closeMenu}
 tabIndex={menuOpen ? 0 : -1}
 className="app-mobile-nav-backdrop absolute inset-0 bg-foreground/40"
 />
 <aside className="app-mobile-nav-panel app-sidebar relative h-full w-[min(18rem,88vw)] border-r border-sidebar-border bg-sidebar shadow-2xl">
 {sidebar}
 </aside>
 </div>

 <div className="lg:pl-72">
 <header className="app-toolbar sticky top-0 z-30 px-4 py-3 sm:px-6">
 <div className="flex min-h-12 items-center justify-between gap-3">
 <div className="flex min-w-0 items-center gap-2">
 <button
 type="button"
 onClick={() => setMenuOpen(true)}
 aria-label="Open navigation"
 className="apple-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border lg:hidden"
 >
 <Menu className="h-5 w-5" />
 </button>
 {pathname !== "/admin" && (
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
 <p className="truncate text-sm font-bold sm:text-base">{currentPage}</p>
 <p className="hidden text-xs text-muted-foreground sm:block">
 Admin <span aria-hidden="true">/</span> {currentPage}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Link
 href="/admin/settings"
 aria-label="Open profile and settings"
 className="app-nav-link hidden min-w-0 items-center gap-3 rounded-xl px-3 py-2 sm:flex"
 >
 <span className="min-w-0 text-right">
 <span className="block max-w-40 truncate text-sm font-semibold">{displayName}</span>
 <span className="block max-w-48 truncate text-xs text-muted-foreground">{email}</span>
 </span>
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
 {initials || "A"}
 </span>
 </Link>
 <Link
 href="/admin/settings"
 aria-label="Profile and settings"
 className="apple-icon-button flex h-11 w-11 items-center justify-center rounded-xl border border-border sm:hidden"
 >
 <Settings className="h-5 w-5" />
 </Link>
 <button
 type="button"
 onClick={handleLogout}
 disabled={loggingOut}
 className="apple-secondary-button flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:border-destructive/40 hover:text-destructive disabled:opacity-60"
 >
 <LogOut className="h-5 w-5" />
 <span className="hidden xl:inline">{loggingOut ? "Signing out..." : "Logout"}</span>
 </button>
 </div>
 </div>
 </header>

 <div className="admin-content">{children}</div>
 </div>
 </div>
 );
}
