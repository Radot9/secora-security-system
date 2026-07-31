import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { dashboardByRole } from "@/lib/auth/roles";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
 try {
 const { profile } = await requireApiRole(["admin", "super_admin"], {
 allowPasswordChangeRequired: true,
 allowIncompleteOnboarding: true,
 });
 const { data: invitation, error } = await supabaseAdmin.from("admin_invitations")
 .select("id, full_name, phone, profile_completed_at, status, expires_at, invited_by")
 .eq("auth_user_id", profile.id).eq("status", "pending").single();
 if (error || !invitation) return Response.json({ error: "A pending administrator invitation was not found." }, { status: 400 });
 if (new Date(invitation.expires_at).getTime() <= Date.now()) {
 await supabaseAdmin.from("admin_invitations").update({ status: "expired" }).eq("id", invitation.id);
 return Response.json({ error: "This invitation has expired. Ask a Super Admin to resend it." }, { status: 400 });
 }

 const completedAt = new Date().toISOString();
 const { error: profileError } = await supabaseAdmin.from("profiles").update({
 full_name: profile.full_name ?? invitation.full_name,
 phone: profile.phone ?? invitation.phone,
 onboarding_completed_at: completedAt,
 must_change_password: false,
 }).eq("id", profile.id);
 if (profileError) return Response.json({ error: "Unable to finish administrator onboarding." }, { status: 500 });

 await supabaseAdmin.from("admin_invitations").update({
 status: "accepted",
 accepted_at: completedAt,
 profile_completed_at: invitation.profile_completed_at ?? completedAt,
 }).eq("id", invitation.id);
 await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: profile.id, target_profile_id: profile.id, target_email: profile.email,
 action: "administrator_invitation_accepted", metadata: { invitation_id: invitation.id, invited_by: invitation.invited_by },
 });
 return Response.json({ success: true, dashboardHref: dashboardByRole[profile.role], shouldSignIn: true });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to finish onboarding." }, { status: 500 });
 }
}
