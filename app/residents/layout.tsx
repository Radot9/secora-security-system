import { requireRole } from "@/lib/auth/requireRole";

export default async function ResidentsLayout({ children }: { children: React.ReactNode }) {
 await requireRole("resident");
 return children;
}
