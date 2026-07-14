import { requireRole } from "@/lib/auth/requireRole";

export default async function SecurityLayout({ children }: { children: React.ReactNode }) {
 await requireRole("security");
 return children;
}
