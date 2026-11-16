import { randomBytes } from "node:crypto";
import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ImportRow = { full_name: string; email: string; phone: string; house_number: string; location_name: string; location_type: "street" | "close" };

export async function POST(request: Request) {
 try {
 const { user } = await requireApiRole(["super_admin"]);
 const body = await request.json();
 const rows = body.rows as ImportRow[];
 if (!Array.isArray(rows) || rows.length === 0 || rows.length > 100) {
 return Response.json({ error: "Choose between 1 and 100 resident rows to import." }, { status: 400 });
 }

 const normalized = rows.map((row) => ({
 full_name: String(row.full_name ?? "").trim(),
 email: String(row.email ?? "").trim().toLowerCase(),
 phone: String(row.phone ?? "").trim(),
 house_number: String(row.house_number ?? "").trim(),
 location_name: String(row.location_name ?? "").trim(),
 location_type: row.location_type === "close" ? "close" as const : "street" as const,
 }));
 const invalidIndex = normalized.findIndex((row) => !row.full_name || !/^\S+@\S+\.\S+$/.test(row.email) || !row.phone || !row.house_number || !row.location_name);
 if (invalidIndex >= 0) return Response.json({ error: `Row ${invalidIndex + 1} is missing a valid name, email, phone, or address.` }, { status: 400 });
 if (new Set(normalized.map((row) => row.email)).size !== normalized.length) {
 return Response.json({ error: "Remove duplicate email addresses from the import before continuing." }, { status: 400 });
 }

 const emails = normalized.map((row) => row.email);
 const [{ data: existingProfiles, error: profileReadError }, { data: existingResidents, error: residentReadError }] = await Promise.all([
 supabaseAdmin.from("profiles").select("id, email, role").in("email", emails),
 supabaseAdmin.from("residents").select("id, user_id, email").in("email", emails),
 ]);
 if (profileReadError) throw profileReadError;
 if (residentReadError) throw residentReadError;
 const profilesByEmail = new Map((existingProfiles ?? []).map((profile) => [profile.email.toLowerCase(), profile]));
 const residentsByEmail = new Set((existingResidents ?? []).map((resident) => (resident.email ?? "").toLowerCase()));

 const outcomes: { email: string; status: "created" | "associated" | "skipped" | "failed"; reason?: string }[] = [];
 for (const row of normalized) {
 const existingProfile = profilesByEmail.get(row.email);
 if (existingProfile && existingProfile.role !== "resident") {
 outcomes.push({ email: row.email, status: "skipped", reason: `Existing ${existingProfile.role} role preserved.` });
 continue;
 }
 if (residentsByEmail.has(row.email)) {
 outcomes.push({ email: row.email, status: "skipped", reason: "Resident record already exists." });
 continue;
 }

 let userId = existingProfile?.id;
 let createdAuthUser = false;
 if (!userId) {
 const { data, error } = await supabaseAdmin.auth.admin.createUser({
 email: row.email,
 password: randomBytes(32).toString("base64url"),
 email_confirm: true,
 });
 if (error || !data.user) { outcomes.push({ email: row.email, status: "failed", reason: "Unable to create the account." }); continue; }
 userId = data.user.id;
 createdAuthUser = true;
 const { error: newProfileError } = await supabaseAdmin.from("profiles").insert({
 id: userId, email: row.email, full_name: row.full_name, phone: row.phone, role: "resident", is_active: true, must_change_password: true,
 });
 if (newProfileError) {
 await supabaseAdmin.auth.admin.deleteUser(userId);
 outcomes.push({ email: row.email, status: "failed", reason: "Unable to create the resident profile." });
 continue;
 }
 }

 const { error: residentInsertError } = await supabaseAdmin.from("residents").insert({
 user_id: userId,
 full_name: row.full_name,
 email: row.email,
 phone: row.phone,
 house_number: row.house_number,
 street: row.location_type === "street" ? row.location_name : null,
 close: row.location_type === "close" ? row.location_name : null,
 is_active: true,
 });
 if (residentInsertError) {
 if (createdAuthUser) {
 await supabaseAdmin.from("profiles").delete().eq("id", userId);
 await supabaseAdmin.auth.admin.deleteUser(userId);
 }
 outcomes.push({ email: row.email, status: "failed", reason: "Unable to create the resident record." });
 continue;
 }
 await supabaseAdmin.from("admin_audit_logs").insert({
 actor_id: user.id,
 target_profile_id: userId,
 target_email: row.email,
 action: existingProfile ? "resident_account_associated_from_import" : "resident_account_created_from_import",
 metadata: { source: "pilot_tester_csv" },
 });
 outcomes.push({ email: row.email, status: existingProfile ? "associated" : "created" });
 }

 return Response.json({ outcomes });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to import resident rows." }, { status: 500 });
 }
}
