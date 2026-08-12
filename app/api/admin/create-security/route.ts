import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";

export async function POST(request: Request) {
 try {
 await requireApiRole(["admin", "super_admin"]);
 const body = await request.json();
 const fullName = String(body.fullName ?? "").trim();
 const email = String(body.email ?? "").trim().toLowerCase();
 const password = String(body.password ?? "");
 const phone = String(body.phone ?? "").trim();
 const gate = String(body.gate ?? "").trim();
 const team = String(body.team ?? "").trim();

 if (!fullName || !email || !password || !phone || !gate || !team) {
 return Response.json({ error: "All fields are required." }, { status: 400 });
 }

 const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
 email, password, email_confirm: true,
 });
 if (authError || !authData.user) {
 const duplicate = authError?.message.toLowerCase().includes("already");
 return Response.json({ error: duplicate ? "Security personnel already exists." : (authError?.message ?? "Unable to create security personnel.") }, { status: 400 });
 }

 const userId = authData.user.id;
 const { error: profileError } = await supabaseAdmin.from("profiles").insert({
 id: userId, email, full_name: fullName, phone, role: "security", is_active: true, must_change_password: true,
 });
 if (profileError) {
 await supabaseAdmin.auth.admin.deleteUser(userId);
 return Response.json({ error: "Unable to create the security profile." }, { status: 400 });
 }

 const { error: securityError } = await supabaseAdmin.from("security_personnel").insert({
 user_id: userId, full_name: fullName, email, phone, gate, team, is_active: true,
 });
 if (securityError) {
 await supabaseAdmin.from("profiles").delete().eq("id", userId);
 await supabaseAdmin.auth.admin.deleteUser(userId);
 return Response.json({ error: "Unable to create the security personnel record." }, { status: 400 });
 }

 return Response.json({ success: true, message: "Security personnel created successfully." });
 } catch (error) {
 const authResponse = authorizationResponse(error);
 if (authResponse) return authResponse;
 return Response.json({ error: "Unable to create security personnel." }, { status: 500 });
 }
}
