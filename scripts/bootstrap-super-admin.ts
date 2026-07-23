import { createClient } from "@supabase/supabase-js";

const enabled = process.env.BOOTSTRAP_SUPER_ADMIN_ENABLED === "true";
const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const redirectTo = process.env.SUPABASE_ADMIN_REDIRECT_URL ?? "http://localhost:3000/administrator-onboarding";

if (!enabled) throw new Error("Bootstrap is disabled. Set BOOTSTRAP_SUPER_ADMIN_ENABLED=true for this one reviewed run.");
if (email !== "nerad9@gmail.com") throw new Error("The bootstrap email does not match the explicitly approved first Super Admin.");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server environment variables are missing.");

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { count: superAdminCount, error: countError } = await supabase.from("profiles")
 .select("id", { count: "exact", head: true }).eq("role", "super_admin");
if (countError) throw countError;
if ((superAdminCount ?? 0) > 0) throw new Error("Bootstrap refused: a Super Admin already exists.");

const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
if (existingProfile) throw new Error("Bootstrap refused: a profile already exists for this email.");
const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (usersError) throw usersError;
if (users.users.filter((user) => user.email?.toLowerCase() === email).length !== 0) {
 throw new Error("Bootstrap refused: an Auth account already exists for this email.");
}

const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
 redirectTo,
 data: { invited_role: "super_admin", bootstrap: true },
});
if (inviteError || !inviteData.user) throw inviteError ?? new Error("Supabase did not return the invited user.");
const userId = inviteData.user.id;

try {
 const { error: profileError } = await supabase.from("profiles").insert({
 id: userId, email, role: "super_admin", is_active: true, must_change_password: true,
 onboarding_completed_at: null,
 });
 if (profileError) throw profileError;

 const { data: invitation, error: invitationError } = await supabase.from("admin_invitations").insert({
 auth_user_id: userId, email, intended_role: "super_admin", status: "pending",
 expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
 }).select("id").single();
 if (invitationError) throw invitationError;

 const { error: auditError } = await supabase.from("admin_audit_logs").insert({
 actor_id: null, target_profile_id: userId, target_email: email,
 action: "first_super_admin_bootstrapped", metadata: { invitation_id: invitation.id, method: "controlled_local_script" },
 });
 if (auditError) throw auditError;
} catch (error) {
 await supabase.from("admin_invitations").delete().eq("auth_user_id", userId);
 await supabase.from("profiles").delete().eq("id", userId);
 await supabase.auth.admin.deleteUser(userId);
 throw error;
}

process.stdout.write("First Super Admin invitation created successfully. Remove the bootstrap enable flag now.\n");
