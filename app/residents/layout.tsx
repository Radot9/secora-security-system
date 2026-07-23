import { requireRole } from "@/lib/auth/requireRole";
import { ResidentDesktopShell } from "./ResidentDesktopShell";

export default async function ResidentsLayout({ children }: { children: React.ReactNode }) {
 const { user, profile } = await requireRole("resident");
 const displayName: string = profile.full_name?.trim() || "Resident";
 const email: string = profile.email || user.email || "";
 const initials = displayName
 .split(/\s+/)
 .slice(0, 2)
 .map((part) => part[0])
 .join("")
 .toUpperCase();

 return (
 <ResidentDesktopShell
 displayName={displayName}
 email={email}
 initials={initials || "R"}
 >
 {children}
 </ResidentDesktopShell>
 );
}
