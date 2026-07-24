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
 const houseNumber = String(body.houseNumber ?? "").trim();
 const locationType = String(body.locationType ?? "").trim();
 const locationName = String(body.locationName ?? "").trim();

 if (!fullName || !email || !password || !phone || !houseNumber || !locationName) {
 return Response.json({ error: "All fields are required." }, { status: 400 });
 }
 if (locationType !== "street" && locationType !== "close") {
 return Response.json({ error: "Select either Street or Close." }, { status: 400 });
 }

 const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
 email,
 password,
 email_confirm: true,
 });
 if (authError || !authData.user) {
 const duplicate = authError?.message.toLowerCase().includes("already");
 return Response.json({ error: duplicate ? "Resident already exists." : (authError?.message ?? "Unable to create resident.") }, { status: 400 });
 }

 const userId = authData.user.id;
 const { error: profileError } = await supabaseAdmin.from("profiles").insert({
 id: userId, email, full_name: fullName, phone, role: "resident", is_active: true, must_change_password: true,
 });
 if (profileError) {
 await supabaseAdmin.auth.admin.deleteUser(userId);
 return Response.json({ error: "Unable to create the resident profile." }, { status: 400 });
 }

 const { error: residentError } = await supabaseAdmin.from("residents").insert({
 user_id: userId,
 full_name: fullName,
 email,
 phone,
 house_number: houseNumber,
 street: locationType === "street" ? locationName : null,
 close: locationType === "close" ? locationName : null,
 is_active: true,
 });
 if (residentError) {
 await supabaseAdmin.from("profiles").delete().eq("id", userId);
 await supabaseAdmin.auth.admin.deleteUser(userId);
 return Response.json({ error: "Unable to create the resident record." }, { status: 400 });
 }

 return Response.json({ success: true, message: "Resident created successfully." });
 } catch (error) {
 const authResponse = authorizationResponse(error);
 if (authResponse) return authResponse;
 return Response.json({ error: "Unable to create resident." }, { status: 500 });
 }
}
