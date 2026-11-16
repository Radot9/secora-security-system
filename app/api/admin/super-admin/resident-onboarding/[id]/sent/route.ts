import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(_request: Request, context: RouteContext<"/api/admin/super-admin/resident-onboarding/[id]/sent">) {
 try {
 const { user } = await requireApiRole(["super_admin"]);
 const { id } = await context.params;
 const { data: resident, error } = await supabaseAdmin.from("residents")
 .select("user_id, email").eq("id", id).maybeSingle();
 if (error) throw error;
 if (!resident?.user_id) return Response.json({ error: "Resident account not found." }, { status: 404 });

 const { data: latest } = await supabaseAdmin.from("admin_audit_logs")
 .select("created_at, metadata")
 .eq("target_profile_id", resident.user_id)
 .eq("action", "resident_invitation_generated")
 .order("created_at", { ascending: false }).limit(1).maybeSingle();
 const expiresAt = typeof latest?.metadata?.expires_at === "string" ? latest.metadata.expires_at : null;
 if (!latest || (expiresAt && Date.parse(expiresAt) <= Date.now())) {
 return Response.json({ error: "Generate a current message before marking this invitation as sent." }, { status: 400 });
 }

 const { error: auditError } = await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: user.id,
 target_profile_id: resident.user_id,
 target_email: resident.email,
 action: "resident_invitation_marked_sent",
 metadata: { invitation_generated_at: latest.created_at },
 });
 if (auditError) throw auditError;
 return Response.json({ success: true });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to mark invitation as sent." }, { status: 500 });
 }
}
