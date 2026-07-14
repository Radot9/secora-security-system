import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
 try {
 const { profile } = await requireApiRole(["admin", "super_admin"]);
 const { data: invitation, error } = await supabaseAdmin.from("admin_invitations")
 .select("id, profile_completed_at, status, expires_at, accepted_at")
 .eq("auth_user_id", profile.id)
 .order("created_at", { ascending: false })
 .limit(1)
 .maybeSingle();

 if (error) return Response.json({ error: "Unable to load onboarding status." }, { status: 500 });

 return Response.json({ profile, invitation });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to load onboarding status." }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const { profile } = await requireApiRole(["admin", "super_admin"]);
 const body = await request.json();
 const fullName = String(body.fullName ?? "").trim();
 const phone = String(body.phone ?? "").trim();
 if (fullName.length < 2 || phone.length < 7) {
 return Response.json({ error: "Enter your full name and a valid phone number." }, { status: 400 });
 }

 const completedAt = new Date().toISOString();
 const { error: profileError } = await supabaseAdmin.from("profiles")
 .update({ full_name: fullName, phone }).eq("id", profile.id);
 if (profileError) return Response.json({ error: "Unable to save your administrator profile." }, { status: 500 });

 const { error: invitationError } = await supabaseAdmin.from("admin_invitations")
 .update({ full_name: fullName, phone, profile_completed_at: completedAt })
 .eq("auth_user_id", profile.id).eq("status", "pending");
 if (invitationError) return Response.json({ error: "Unable to complete your invitation profile." }, { status: 500 });

 return Response.json({ success: true });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to save profile." }, { status: 500 });
 }
}
