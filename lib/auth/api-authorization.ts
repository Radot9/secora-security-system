import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessRole, isUserRole, type ProfileAccess, type UserRole } from "./roles";

export class ApiAuthorizationError extends Error {
 constructor(message: string, public status: 401 | 403) {
 super(message);
 }
}

type ApiRoleOptions = {
 allowPasswordChangeRequired?: boolean;
 allowIncompleteOnboarding?: boolean;
};

export async function requireApiRole(
 allowedRoles: readonly UserRole[],
 options: ApiRoleOptions = {},
) {
 const supabase = await createSupabaseServerClient();
 const { data: { user }, error: userError } = await supabase.auth.getUser();

 if (userError || !user) {
 throw new ApiAuthorizationError("Please sign in to continue.", 401);
 }

 const { data, error } = await supabase
 .from("profiles")
 .select("id, email, full_name, phone, role, is_active, must_change_password, onboarding_completed_at")
 .eq("id", user.id)
 .single();

 if (error || !data || !isUserRole(data.role)) {
 throw new ApiAuthorizationError("Your account profile could not be verified.", 403);
 }

 const profile = data as ProfileAccess;
 if (!profile.is_active) {
 throw new ApiAuthorizationError("Your account is inactive. Contact a Super Admin.", 403);
 }
 if (profile.must_change_password && !options.allowPasswordChangeRequired) {
 throw new ApiAuthorizationError("Change your temporary password before continuing.", 403);
 }
 if (
 (profile.role === "admin" || profile.role === "super_admin") &&
 !profile.onboarding_completed_at &&
 !options.allowIncompleteOnboarding
 ) {
 throw new ApiAuthorizationError("Complete administrator onboarding before continuing.", 403);
 }
 if (!canAccessRole(profile.role, allowedRoles)) {
 throw new ApiAuthorizationError("You do not have permission to perform this action.", 403);
 }

 return { user, profile, supabase };
}

export function authorizationResponse(error: unknown) {
 if (error instanceof ApiAuthorizationError) {
 return Response.json({ error: error.message }, { status: error.status });
 }
 return null;
}
