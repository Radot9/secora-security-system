import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { dashboardByRole } from "@/lib/auth/roles";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
 try {
 const { profile } = await requireApiRole(["super_admin", "admin", "resident", "security"], {
 allowPasswordChangeRequired: true,
 allowIncompleteOnboarding: true,
 });
 const isAdministrator = profile.role === "admin" || profile.role === "super_admin";
 const completedAt = new Date().toISOString();

 const { data: invitation, error: invitationError } = isAdministrator
 ? await supabaseAdmin
 .from("admin_invitations")
 .select("id, full_name, phone, status, expires_at, invited_by, profile_completed_at")
 .eq("auth_user_id", profile.id)
 .eq("status", "pending")
 .maybeSingle()
 : { data: null, error: null };

 if (invitationError) {
 return Response.json({ error: "Password changed, but administrator invitation could not be verified." }, { status: 500 });
 }

 if (invitation && new Date(invitation.expires_at).getTime() <= Date.now()) {
 await supabaseAdmin.from("admin_invitations").update({ status: "expired" }).eq("id", invitation.id);
 return Response.json({ error: "Password changed, but the administrator invitation has expired. Ask a Super Admin to resend it." }, { status: 400 });
 }

 const { error } = await supabaseAdmin.from("profiles").update({
 full_name: profile.full_name ?? invitation?.full_name ?? null,
 phone: profile.phone ?? invitation?.phone ?? null,
 must_change_password: false,
 onboarding_completed_at: isAdministrator ? (profile.onboarding_completed_at ?? completedAt) : profile.onboarding_completed_at,
 }).eq("id", profile.id);
 if (error) return Response.json({ error: "Password changed, but account setup could not be finalized." }, { status: 500 });

 if (invitation) {
 await supabaseAdmin.from("admin_invitations").update({
 status: "accepted",
 accepted_at: completedAt,
 profile_completed_at: invitation.profile_completed_at ?? completedAt,
 }).eq("id", invitation.id);
 await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: profile.id,
 target_profile_id: profile.id,
 target_email: profile.email,
 action: "administrator_invitation_accepted",
 metadata: { invitation_id: invitation.id, invited_by: invitation.invited_by, finalized_from: "password_change" },
 });
 }

 return Response.json({
 success: true,
 dashboardHref: dashboardByRole[profile.role],
 shouldSignIn: Boolean(invitation),
 });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to finalize password change." }, { status: 500 });
 }
}
