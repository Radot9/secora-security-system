"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 Activity,
 ArrowLeft,
 BarChart3,
 Bell,
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
 label: "Communication",
 items: [{ label: "Announcements", href: "/admin/announcements", icon: Bell }],
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
 "/admin/announcements": "Announcements",
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
 const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);
 const [loggingOut, setLoggingOut] = useState(false);

 const currentPage =
 pageNames[pathname] ??
 (pathname.startsWith("/admin/administrators/") ? "Administrator Details" : "Admin");

 const closeMenu = () => setMenuOpen(false);

 useEffect(() => {
 if (!menuOpen) return;
 const previousOverflow = document.body.style.overflow;
 const closeOnEscape = (event: KeyboardEvent) => {
 if (event.key === "Escape") setMenuOpen(false);
 };

 document.body.style.overflow = "hidden";
 window.addEventListener("keydown", closeOnEscape);
 return () => {
 document.body.style.overflow = previousOverflow;
 window.removeEventListener("keydown", closeOnEscape);
 };
 }, [menuOpen]);

 async function handleLogout() {
 setLoggingOut(true);
 await supabase.auth.signOut();
 router.replace("/");
 router.refresh();
 }

 function renderSidebar(
 onToggle: () => void,
 onNavigate?: () => void,
 collapsed = false,
 ) {
 return (
 <div className="flex h-full flex-col">
 <div className="app-sidebar-header relative flex h-20 items-center justify-between border-b border-sidebar-border px-5">
 {!collapsed ? <Link href="/admin" onClick={onNavigate} className="app-sidebar-brand flex min-w-0 items-center gap-3">
 <BrandMark size="small" />
 <span className="app-sidebar-copy min-w-0">
 <span className="block text-base font-bold tracking-[-0.02em]">Entriseq</span>
 <span className="block text-xs text-muted-foreground">Administration</span>
 </span>
 </Link> : null}
 <button
 type="button"
 onClick={onToggle}
 aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
 aria-expanded={!collapsed}
 className="app-sidebar-toggle apple-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-sidebar-accent"
 >
 {collapsed ? <Menu className="h-5 w-5" aria-hidden="true" /> : <X className="h-5 w-5" aria-hidden="true" />}
 </button>
 </div>

 <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
 {navigationGroups.map((group) => (
 <div key={group.label}>
 <p className="app-sidebar-section-label mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
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
 title={collapsed ? item.label : undefined}
 onClick={onNavigate}
 aria-current={active ? "page" : undefined}
 data-active={active}
 className="app-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground"
 >
 <Icon className="h-5 w-5 shrink-0" />
 <span className="app-sidebar-copy">{item.label}</span>
 </Link>
 );
 })}
 </div>
 </div>
 ))}

 {isSuperAdmin && (
 <div>
 <p className="app-sidebar-section-label mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
 Administration
 </p>
 <div className="space-y-1">
 <Link
 href="/admin/super-admin"
 title={collapsed ? "Super Admin" : undefined}
 onClick={onNavigate}
 data-active={isActivePath(pathname, "/admin/super-admin")}
 className="app-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
 >
 <UserCog className="h-5 w-5" />
 <span className="app-sidebar-copy">Super Admin</span>
 </Link>
 <Link
 href="/admin/administrators"
 title={collapsed ? "Administrators" : undefined}
 onClick={onNavigate}
 data-active={isActivePath(pathname, "/admin/administrators")}
 className="app-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
 >
 <UserPlus className="h-5 w-5" />
 <span className="app-sidebar-copy">Administrators</span>
 </Link>
 </div>
 </div>
 )}
 </nav>

 <div className="border-t border-sidebar-border p-3">
 <Link
 href="/admin/settings"
 title={collapsed ? `${displayName} · ${roleLabel}` : undefined}
 onClick={onNavigate}
 className="app-nav-link app-sidebar-profile flex items-center gap-3 rounded-xl p-3"
 >
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
 {initials || "A"}
 </span>
 <span className="app-sidebar-copy min-w-0 flex-1">
 <span className="block truncate text-sm font-semibold">{displayName}</span>
 <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
 </span>
 <ChevronRight className="app-sidebar-copy h-4 w-4 text-muted-foreground" />
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-background text-foreground">
 <aside
 id="admin-desktop-navigation"
 data-expanded={desktopMenuOpen}
 className="app-desktop-sidebar app-sidebar fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block"
 >
 {renderSidebar(() => setDesktopMenuOpen((open) => !open), undefined, !desktopMenuOpen)}
 </aside>

 <div
 className="app-mobile-nav fixed inset-0 z-50 lg:hidden"
 data-open={menuOpen}
 aria-hidden={!menuOpen}
 inert={!menuOpen}
 >
 <button
 type="button"
 aria-label="Close navigation overlay"
 onClick={closeMenu}
 tabIndex={menuOpen ? 0 : -1}
 className="app-mobile-nav-backdrop absolute inset-0 bg-foreground/40"
 />
 <aside id="admin-mobile-navigation" className="app-mobile-nav-panel app-sidebar relative h-full w-[min(18rem,88vw)] border-r border-sidebar-border bg-sidebar shadow-2xl">
 {renderSidebar(closeMenu, closeMenu)}
 </aside>
 </div>

 <div className="app-shell-content" data-sidebar-open={desktopMenuOpen}>
 <header className="app-toolbar sticky top-0 z-30 px-4 py-3 sm:px-6">
 <div className="flex min-h-12 items-center justify-between gap-3">
 <div className="flex min-w-0 items-center gap-2">
 <div className="flex shrink-0 items-center gap-2 lg:hidden">
 <Link href="/admin" className="flex items-center gap-2" aria-label="Entriseq administration dashboard">
 <BrandMark size="small" />
 <span className="hidden text-sm font-bold min-[430px]:inline">Entriseq</span>
 </Link>
 <button
 type="button"
 onClick={() => setMenuOpen(true)}
 aria-label="Open navigation"
 aria-expanded={menuOpen}
 aria-controls="admin-mobile-navigation"
 className="apple-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border"
 >
 <Menu className="h-5 w-5" />
 </button>
 </div>
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
