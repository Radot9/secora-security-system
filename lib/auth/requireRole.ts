import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessRole, dashboardByRole, isUserRole, type UserRole } from "./roles";

export async function requireRole(requiredRoles: UserRole | readonly UserRole[]) {
 const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
 const supabase = await createSupabaseServerClient();
 const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
 const userId = claimsData?.claims.sub;

 if (claimsError || !userId) redirect("/");

 const { data: profile } = await supabase
 .from("profiles")
 .select("full_name, email, role, must_change_password, is_active, onboarding_completed_at")
 .eq("id", userId)
 .single();

 if (!profile || !profile.is_active || !isUserRole(profile.role)) redirect("/");
 if (profile.must_change_password) redirect("/update-password");
 if ((profile.role === "admin" || profile.role === "super_admin") && !profile.onboarding_completed_at) {
 redirect("/administrator-onboarding");
 }

 if (!canAccessRole(profile.role, allowedRoles)) redirect(dashboardByRole[profile.role]);

 return {
 user: {
 id: userId,
 email: typeof claimsData.claims.email === "string" ? claimsData.claims.email : undefined,
 },
 profile,
 };
}
