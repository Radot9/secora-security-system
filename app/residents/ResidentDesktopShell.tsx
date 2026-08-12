"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 Activity,
 ArrowLeft,
 ChevronRight,
 Home,
 LogOut,
 Menu,
 MessageCircle,
 QrCode,
 Settings,
 TicketPlus,
 Tickets,
 UserRound,
 X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { BrandMark } from "@/app/components/ui/BrandMark";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";
import { AnnouncementNavIcon } from "@/app/components/AnnouncementNavIcon";

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
 { label: "Generate Pass", href: "/residents/generate-code", icon: TicketPlus },
 { label: "My Passes", href: "/residents/visitors", icon: Tickets },
 { label: "Latest Access Code", href: "/residents/access-code", icon: QrCode },
 { label: "Activity", href: "/residents/activity", icon: Activity },
 ],
 },
 {
 label: "Community",
 items: [
 { label: "Announcements", href: "/residents/announcements", icon: MessageCircle },
 { label: "Community Forum", href: "/residents/community", icon: MessageCircle },
 ],
 },
 {
 label: "Account",
 items: [
 { label: "My Profile", href: "/residents/profile", icon: UserRound },
 { label: "Settings", href: "/residents/settings", icon: Settings },
 ],
 },
];

const pageNames: Record<string, string> = {
 "/residents": "Dashboard",
 "/residents/generate-code": "Generate Pass",
 "/residents/visitors": "My Passes",
 "/residents/access-code": "Access Code",
 "/residents/activity": "Activity",
 "/residents/announcements": "Announcements",
 "/residents/community": "Community Forum",
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
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);
 const currentPage = pageNames[pathname] ?? "Resident";

 useEffect(() => {
 if (!mobileMenuOpen) return;
 const previousOverflow = document.body.style.overflow;
 const closeOnEscape = (event: KeyboardEvent) => {
 if (event.key === "Escape") setMobileMenuOpen(false);
 };

 document.body.style.overflow = "hidden";
 window.addEventListener("keydown", closeOnEscape);
 return () => {
 document.body.style.overflow = previousOverflow;
 window.removeEventListener("keydown", closeOnEscape);
 };
 }, [mobileMenuOpen]);

 async function handleLogout() {
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
 {!collapsed ? <Link href="/residents" onClick={onNavigate} className="app-sidebar-brand flex min-w-0 items-center gap-3">
 <BrandMark size="small" />
 <span className="app-sidebar-copy min-w-0">
 <span className="block truncate text-base font-bold tracking-[-0.02em]">Entriseq</span>
 <span className="block truncate text-xs text-muted-foreground">Resident Portal</span>
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

 <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Resident navigation">
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
 {item.href === "/residents/announcements" ? <AnnouncementNavIcon /> : <Icon className="h-5 w-5 shrink-0" />}
 <span className="app-sidebar-copy">{item.label}</span>
 </Link>
 );
 })}
 </div>
 </div>
 ))}
 </nav>

 <div className="border-t border-sidebar-border p-3">
 <div className="app-sidebar-support mb-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
 <p className="text-sm font-bold">Need help?</p>
 <p className="mt-1 text-xs leading-5 text-muted-foreground">Our security team is available when you need assistance.</p>
 <a href="tel:07045739437" className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
 Contact Security
 </a>
 </div>
 <Link
 href="/residents/profile"
 title={collapsed ? `${displayName} · Resident` : undefined}
 onClick={onNavigate}
 className="app-nav-link app-sidebar-profile flex items-center gap-3 rounded-xl p-3"
 >
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
 {initials}
 </span>
 <span className="app-sidebar-copy min-w-0 flex-1">
 <span className="block truncate text-sm font-semibold">{displayName}</span>
 <span className="block truncate text-xs text-muted-foreground">Resident</span>
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
 id="resident-desktop-navigation"
 data-expanded={desktopMenuOpen}
 className="app-desktop-sidebar app-sidebar fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block"
 >
 {renderSidebar(() => setDesktopMenuOpen((open) => !open), undefined, !desktopMenuOpen)}
 </aside>

 <div
 className="app-mobile-nav fixed inset-0 z-50 lg:hidden"
 data-open={mobileMenuOpen}
 aria-hidden={!mobileMenuOpen}
 inert={!mobileMenuOpen}
 >
 <button
 type="button"
 aria-label="Close navigation overlay"
 onClick={() => setMobileMenuOpen(false)}
 tabIndex={mobileMenuOpen ? 0 : -1}
 className="app-mobile-nav-backdrop absolute inset-0 bg-foreground/40"
 />
 <aside
 id="resident-mobile-navigation"
 className="app-mobile-nav-panel app-sidebar relative h-full w-[min(18rem,88vw)] border-r border-sidebar-border bg-sidebar shadow-2xl"
 >
 {renderSidebar(() => setMobileMenuOpen(false), () => setMobileMenuOpen(false))}
 </aside>
 </div>

 <div className="app-shell-content" data-sidebar-open={desktopMenuOpen}>
 <header className="app-toolbar sticky top-0 z-30 px-4 py-3 sm:px-6">
 <div className="flex min-h-12 items-center justify-between gap-3">
 <div className="flex min-w-0 items-center gap-2">
 <div className="flex shrink-0 items-center gap-2 lg:hidden">
 <Link href="/residents" className="flex items-center gap-2" aria-label="Entriseq resident dashboard">
 <BrandMark size="small" />
 <span className="hidden text-sm font-bold min-[430px]:inline">Entriseq</span>
 </Link>
 <button
 type="button"
 onClick={() => setMobileMenuOpen(true)}
 aria-label="Open navigation"
 aria-expanded={mobileMenuOpen}
 aria-controls="resident-mobile-navigation"
 className="apple-icon-button flex h-11 w-11 items-center justify-center rounded-xl border border-border"
 >
 <Menu className="h-5 w-5" />
 </button>
 </div>
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
 <div className="hidden min-w-0 sm:block">
 <p className="truncate text-sm font-bold sm:text-base">{currentPage}</p>
 <p className="hidden text-xs text-muted-foreground lg:block">
 Resident <span aria-hidden="true">/</span> {currentPage}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <ThemeToggle />
 <Link
 href="/residents/profile"
 className="app-nav-link hidden min-w-0 items-center gap-3 rounded-xl px-3 py-2 sm:flex"
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
 aria-label="Logout"
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
