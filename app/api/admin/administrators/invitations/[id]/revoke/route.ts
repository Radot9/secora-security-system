import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, context: RouteContext<"/api/admin/administrators/invitations/[id]/revoke">) {
 try {
 const { profile: actor } = await requireApiRole(["super_admin"]);
 const { id } = await context.params;
 const body = await request.json().catch(() => ({}));
 const reason = String(body.reason ?? "").trim() || null;
 const { data: invitation, error } = await supabaseAdmin.from("admin_invitations")
 .select("id, email, auth_user_id, status").eq("id", id).single();
 if (error || !invitation) return Response.json({ error: "Invitation not found." }, { status: 404 });
 if (invitation.status !== "pending") return Response.json({ error: "Only pending invitations can be revoked." }, { status: 400 });

 if (invitation.auth_user_id) {
 const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(invitation.auth_user_id, { ban_duration: "876000h" });
 if (banError) return Response.json({ error: "Unable to revoke authentication access." }, { status: 500 });
 await supabaseAdmin.from("profiles").update({
 is_active: false, deactivated_at: new Date().toISOString(), deactivated_by: actor.id,
 }).eq("id", invitation.auth_user_id);
 }

 await supabaseAdmin.from("admin_invitations").update({
 status: "revoked", revoked_at: new Date().toISOString(), revoked_by: actor.id, revoke_reason: reason,
 }).eq("id", id);
 await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: actor.id, target_profile_id: invitation.auth_user_id, target_email: invitation.email,
 action: "administrator_invitation_revoked", metadata: { invitation_id: id, reason },
 });
 return Response.json({ success: true });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to revoke invitation." }, { status: 500 });
 }
}
