import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessRole, dashboardByRole, isUserRole, type UserRole } from "./roles";

const getCurrentAccess = cache(async () => {
 const supabase = await createSupabaseServerClient();
 const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
 const userId = claimsData?.claims.sub;

 if (claimsError || !userId) return null;

 const { data: profile } = await supabase
 .from("profiles")
 .select("full_name, email, role, must_change_password, is_active, onboarding_completed_at")
 .eq("id", userId)
 .single();

 if (!profile || !isUserRole(profile.role)) return null;

 const accessProfile = {
 full_name: typeof profile.full_name === "string" ? profile.full_name : null,
 email: typeof profile.email === "string" ? profile.email : "",
 role: profile.role,
 must_change_password: Boolean(profile.must_change_password),
 is_active: Boolean(profile.is_active),
 onboarding_completed_at:
 typeof profile.onboarding_completed_at === "string" ? profile.onboarding_completed_at : null,
 };

 return {
 user: {
 id: userId,
 email: typeof claimsData.claims.email === "string" ? claimsData.claims.email : undefined,
 },
 profile: accessProfile,
 };
});

export async function requireRole(requiredRoles: UserRole | readonly UserRole[]) {
 const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
 const access = await getCurrentAccess();

 if (!access) redirect("/");

 const { user, profile } = access;
 if (!profile.is_active) redirect("/");
 if (profile.must_change_password) redirect("/update-password");
 if ((profile.role === "admin" || profile.role === "super_admin") && !profile.onboarding_completed_at) {
 redirect("/administrator-onboarding");
 }

 if (!canAccessRole(profile.role, allowedRoles)) redirect(dashboardByRole[profile.role]);

 return { user, profile };
}
