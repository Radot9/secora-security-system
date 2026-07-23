import { requireRole } from "@/lib/auth/requireRole";
import { AdminNavigationShell } from "./AdminNavigationShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
 const { user, profile } = await requireRole(["admin", "super_admin"]);
 const displayName: string = profile.full_name?.trim() || "Administrator";
 const email: string = profile.email || user.email || "";
 const initials = displayName
 .split(/\s+/)
 .slice(0, 2)
 .map((part) => part[0])
 .join("")
 .toUpperCase();
 const roleLabel = profile.role === "super_admin" ? "Super Admin" : "Admin";

 return (
 <AdminNavigationShell
 displayName={displayName}
 email={email}
 roleLabel={roleLabel}
 isSuperAdmin={profile.role === "super_admin"}
 initials={initials}
 >
 {children}
 </AdminNavigationShell>
 );
}
