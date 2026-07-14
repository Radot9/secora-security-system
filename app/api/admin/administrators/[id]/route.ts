import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { isUserRole, validateAdministratorTransition } from "@/lib/auth/roles";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_request: Request, context: RouteContext<"/api/admin/administrators/[id]">) {
 try {
 await requireApiRole(["super_admin"]);
 const { id } = await context.params;
 const { data, error } = await supabaseAdmin.from("profiles")
 .select("id, email, full_name, phone, role, is_active, created_at, invited_by, deactivated_at, onboarding_completed_at")
 .eq("id", id).in("role", ["admin", "super_admin"]).single();
 if (error || !data) return Response.json({ error: "Administrator not found." }, { status: 404 });
 const { data: auditLogs } = await supabaseAdmin.from("admin_audit_logs")
 .select("id, action, actor_id, target_email, metadata, created_at")
 .eq("target_profile_id", id).order("created_at", { ascending: false });
 return Response.json({ administrator: data, auditLogs: auditLogs ?? [] });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to load administrator." }, { status: 500 });
 }
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/administrators/[id]">) {
 try {
 const { profile: actor } = await requireApiRole(["super_admin"]);
 const { id } = await context.params;
 const body = await request.json();
 const nextRole = body.role;
 const nextActive = body.isActive;
 if (!isUserRole(nextRole) || !["admin", "super_admin"].includes(nextRole) || typeof nextActive !== "boolean") {
 return Response.json({ error: "Invalid administrator role or status." }, { status: 400 });
 }

 const { data: target, error: targetError } = await supabaseAdmin.from("profiles")
 .select("id, role, is_active").eq("id", id).single();
 const { count: activeSuperAdminCount } = await supabaseAdmin.from("profiles")
 .select("id", { count: "exact", head: true }).eq("role", "super_admin").eq("is_active", true);
 if (targetError || !target || !isUserRole(target.role)) return Response.json({ error: "Administrator not found." }, { status: 404 });

 const transitionError = validateAdministratorTransition({
 actorId: actor.id, targetId: id, currentRole: target.role, nextRole,
 currentActive: target.is_active, nextActive, activeSuperAdminCount: activeSuperAdminCount ?? 0,
 });
 if (transitionError) return Response.json({ error: transitionError }, { status: 400 });

 const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
 ban_duration: nextActive ? "none" : "876000h",
 });
 if (authError) return Response.json({ error: "Unable to update administrator authentication access." }, { status: 500 });

 const { error: rpcError } = await supabaseAdmin.rpc("super_admin_update_administrator", {
 p_actor_id: actor.id,
 p_target_id: id,
 p_role: nextRole,
 p_is_active: nextActive,
 p_reason: String(body.reason ?? "").trim() || null,
 });
 if (rpcError) {
 await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: target.is_active ? "none" : "876000h" });
 return Response.json({ error: rpcError.message }, { status: 400 });
 }

 return Response.json({ success: true });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to update administrator." }, { status: 500 });
 }
}
