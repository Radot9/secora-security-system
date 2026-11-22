import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, context: RouteContext<"/api/admin/super-admin/resident-onboarding/[id]/invitation">) {
 let actorId: string | undefined;
 try {
 const { user } = await requireApiRole(["super_admin"]);
 actorId = user.id;
 const { id } = await context.params;
 const { data: resident, error: residentError } = await supabaseAdmin.from("residents")
 .select("id, user_id, email, is_active").eq("id", id).maybeSingle();
 if (residentError) throw residentError;
 if (!resident) return Response.json({ error: "Resident not found." }, { status: 404 });
 if (!resident.is_active || !resident.user_id) return Response.json({ error: "This resident does not have an active account." }, { status: 400 });

 const { data: profile, error: profileError } = await supabaseAdmin.from("profiles")
 .select("id, email, role, is_active").eq("id", resident.user_id).maybeSingle();
 if (profileError) throw profileError;
 if (!profile || profile.role !== "resident" || !profile.is_active || !profile.email) {
 return Response.json({ error: "An active resident account could not be verified." }, { status: 400 });
 }

 const { data, error } = await supabaseAdmin.auth.admin.generateLink({
 type: "recovery",
 email: profile.email,
 });
 const tokenHash = data?.properties?.hashed_token;
 if (error || !tokenHash) return Response.json({ error: "Unable to generate an activation link. Try again." }, { status: 400 });
 const siteOrigin = process.env.VERCEL_ENV === "preview" ? new URL(request.url).origin : process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
 const activationUrl = new URL("/activate", siteOrigin);
 activationUrl.searchParams.set("token_hash", tokenHash);
 activationUrl.searchParams.set("type", "recovery");

 const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
 const { error: auditError } = await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: actorId,
 target_profile_id: profile.id,
 target_email: profile.email,
 action: "resident_invitation_generated",
 metadata: { expires_at: expiresAt },
 });
 if (auditError) return Response.json({ error: "The link was generated but could not be recorded. Please retry before copying." }, { status: 500 });

 return Response.json({ action_link: activationUrl.toString(), expires_at: expiresAt }, { headers: { "Cache-Control": "no-store, private" } });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to generate an activation link." }, { status: 500 });
 }
}
