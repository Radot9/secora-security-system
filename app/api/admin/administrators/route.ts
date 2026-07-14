import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
 try {
 await requireApiRole(["super_admin"]);
 const [{ data: administrators, error: profilesError }, { data: invitations, error: invitationsError }] = await Promise.all([
 supabaseAdmin.from("profiles")
 .select("id, email, full_name, phone, role, is_active, created_at, invited_by, deactivated_at, onboarding_completed_at")
 .in("role", ["admin", "super_admin"])
 .order("created_at"),
 supabaseAdmin.from("admin_invitations")
 .select("id, auth_user_id, email, full_name, phone, intended_role, status, expires_at, created_at")
 .order("created_at", { ascending: false }),
 ]);

 if (profilesError || invitationsError) {
 return Response.json({ error: "Unable to load administrators." }, { status: 500 });
 }
 return Response.json({ administrators, invitations });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to load administrators." }, { status: 500 });
 }
}

export async function POST(request: Request) {
 let createdUserId: string | null = null;
 try {
 const { profile: actor } = await requireApiRole(["super_admin"]);
 const body = await request.json();
 const fullName = String(body.fullName ?? "").trim();
 const email = String(body.email ?? "").trim().toLowerCase();
 const phone = String(body.phone ?? "").trim();

 if (!fullName || !phone || !emailPattern.test(email)) {
 return Response.json({ error: "Enter a valid full name, email, and phone number." }, { status: 400 });
 }

 const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
 const { data: existingInvite } = await supabaseAdmin.from("admin_invitations").select("id").eq("email", email).eq("status", "pending").maybeSingle();
 if (existingProfile || existingInvite) {
 return Response.json({ error: "An account or pending invitation already exists for this email." }, { status: 409 });
 }

 const redirectTo = process.env.SUPABASE_ADMIN_REDIRECT_URL ?? `${new URL(request.url).origin}/administrator-onboarding`;
 const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
 redirectTo,
 data: { full_name: fullName, phone, invited_role: "admin" },
 });
 if (inviteError || !inviteData.user) {
 return Response.json({ error: inviteError?.message ?? "Unable to send the administrator invitation." }, { status: 400 });
 }
 createdUserId = inviteData.user.id;

 const { error: profileError } = await supabaseAdmin.from("profiles").insert({
 id: createdUserId,
 email,
 full_name: fullName,
 phone,
 role: "admin",
 is_active: true,
 must_change_password: true,
 invited_by: actor.id,
 onboarding_completed_at: null,
 });
 if (profileError) throw new Error("PROFILE_CREATE_FAILED");

 const { data: invitation, error: invitationError } = await supabaseAdmin.from("admin_invitations").insert({
 auth_user_id: createdUserId,
 email,
 full_name: fullName,
 phone,
 intended_role: "admin",
 invited_by: actor.id,
 expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
 }).select("id, email, status, expires_at").single();
 if (invitationError) throw new Error("INVITATION_CREATE_FAILED");

 await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: actor.id,
 target_profile_id: createdUserId,
 target_email: email,
 action: "administrator_invited",
 metadata: { invitation_id: invitation.id },
 });

 return Response.json({ invitation }, { status: 201 });
 } catch (error) {
 const authResponse = authorizationResponse(error);
 if (authResponse) return authResponse;
 if (createdUserId) {
 await supabaseAdmin.from("admin_invitations").delete().eq("auth_user_id", createdUserId);
 await supabaseAdmin.from("profiles").delete().eq("id", createdUserId);
 await supabaseAdmin.auth.admin.deleteUser(createdUserId);
 }
 return Response.json({ error: "The invitation could not be completed. No administrator access was granted." }, { status: 500 });
 }
}
