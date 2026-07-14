import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function countRows(table: string, filters: Record<string, string | boolean> = {}) {
 let query = supabaseAdmin.from(table).select("id", { count: "exact", head: true });

 for (const [column, value] of Object.entries(filters)) {
 query = query.eq(column, value);
 }

 const { count, error } = await query;
 if (error) throw error;
 return count ?? 0;
}

export async function GET() {
 try {
 await requireApiRole(["super_admin"]);

 const startOfToday = new Date();
 startOfToday.setHours(0, 0, 0, 0);

 const [
 totalAdministratorsResult,
 activeSuperAdmins,
 activeAdmins,
 inactiveAdministrators,
 incompleteAdministrators,
 pendingInvitations,
 activeResidents,
 inactiveResidents,
 activeSecurity,
 inactiveSecurity,
 visitorsToday,
 currentlyInside,
 revokedPasses,
 pendingPasses,
 invitationsResult,
 auditResult,
 ] = await Promise.all([
 supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
 countRows("profiles", { role: "super_admin", is_active: true }),
 countRows("profiles", { role: "admin", is_active: true }),
 supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]).eq("is_active", false),
 supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]).is("onboarding_completed_at", null),
 countRows("admin_invitations", { status: "pending" }),
 countRows("residents", { is_active: true }),
 countRows("residents", { is_active: false }),
 countRows("security_personnel", { is_active: true }),
 countRows("security_personnel", { is_active: false }),
 supabaseAdmin.from("visitors").select("id", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
 countRows("visitors", { status: "entered" }),
 countRows("visitors", { status: "revoked" }),
 countRows("visitors", { status: "pending" }),
 supabaseAdmin
 .from("admin_invitations")
 .select("id, email, full_name, intended_role, status, expires_at, created_at")
 .eq("status", "pending")
 .order("created_at", { ascending: false })
 .limit(5),
 supabaseAdmin
 .from("admin_audit_logs")
 .select("id, target_email, action, metadata, created_at")
 .order("created_at", { ascending: false })
 .limit(8),
 ]);

 if (totalAdministratorsResult.error) throw totalAdministratorsResult.error;
 if ("error" in inactiveAdministrators && inactiveAdministrators.error) throw inactiveAdministrators.error;
 if ("error" in incompleteAdministrators && incompleteAdministrators.error) throw incompleteAdministrators.error;
 if ("error" in visitorsToday && visitorsToday.error) throw visitorsToday.error;
 if (invitationsResult.error) throw invitationsResult.error;
 if (auditResult.error) throw auditResult.error;

 const totalAdministrators = totalAdministratorsResult.count ?? 0;
 const inactiveAdministratorCount = inactiveAdministrators.count ?? 0;
 const incompleteAdministratorCount = incompleteAdministrators.count ?? 0;
 const visitorsTodayCount = visitorsToday.count ?? 0;

 return Response.json({
 overview: {
 administrators: {
 total: totalAdministrators,
 activeSuperAdmins,
 activeAdmins,
 inactive: inactiveAdministratorCount,
 incompleteOnboarding: incompleteAdministratorCount,
 pendingInvitations,
 },
 estateAccounts: {
 activeResidents,
 inactiveResidents,
 activeSecurity,
 inactiveSecurity,
 },
 access: {
 visitorsToday: visitorsTodayCount,
 currentlyInside,
 revokedPasses,
 pendingPasses,
 },
 pendingInvitations: invitationsResult.data ?? [],
 recentAuditLogs: auditResult.data ?? [],
 },
 });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to load Super Admin dashboard." }, { status: 500 });
 }
}
