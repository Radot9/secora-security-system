import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, context: RouteContext<"/api/admin/administrators/invitations/[id]/resend">) {
 try {
 const { profile: actor } = await requireApiRole(["super_admin"]);
 const { id } = await context.params;
 const { data: invitation, error } = await supabaseAdmin.from("admin_invitations")
 .select("id, email, auth_user_id, status").eq("id", id).single();
 if (error || !invitation) return Response.json({ error: "Invitation not found." }, { status: 404 });
 if (invitation.status !== "pending") return Response.json({ error: "Only pending invitations can be resent." }, { status: 400 });

 const redirectTo = process.env.SUPABASE_ADMIN_REDIRECT_URL ?? `${new URL(request.url).origin}/administrator-onboarding`;
 const { error: resendError } = await supabaseAdmin.auth.resend({
 type: "signup", email: invitation.email, options: { emailRedirectTo: redirectTo },
 });
 if (resendError) return Response.json({ error: resendError.message }, { status: 400 });

 const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
 await supabaseAdmin.from("admin_invitations").update({ expires_at: expiresAt }).eq("id", id);
 await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: actor.id, target_profile_id: invitation.auth_user_id, target_email: invitation.email,
 action: "administrator_invitation_resent", metadata: { invitation_id: id },
 });
 return Response.json({ success: true, expiresAt });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to resend invitation." }, { status: 500 });
 }
}
