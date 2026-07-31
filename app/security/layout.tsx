import { Suspense } from "react";

import { DashboardRouteLoading } from "@/app/components/ui/DashboardLoading";
import { requireRole } from "@/lib/auth/requireRole";

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
 return (
 <Suspense fallback={<DashboardRouteLoading label="Preparing the security dashboard" />}>
 <AuthorizedSecurityLayout>{children}</AuthorizedSecurityLayout>
 </Suspense>
 );
}

async function AuthorizedSecurityLayout({ children }: { children: React.ReactNode }) {
 await requireRole("security");
 return children;
}
