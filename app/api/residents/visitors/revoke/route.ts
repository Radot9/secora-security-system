import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateVisitorRevocation } from "@/lib/visitor-status";

export async function POST(request: Request) {
 try {
 const { user } = await requireApiRole(["resident"]);
 const body = await request.json();
 const accessCode = String(body.accessCode ?? "").trim();

 if (!accessCode) {
 return Response.json({ error: "Access code is required." }, { status: 400 });
 }

 const { data: resident, error: residentError } = await supabaseAdmin
 .from("residents")
 .select("id")
 .eq("user_id", user.id)
 .eq("is_active", true)
 .single();

 if (residentError || !resident) {
 return Response.json({ error: "Resident profile was not found." }, { status: 403 });
 }

 const { data: visitor, error: visitorError } = await supabaseAdmin
 .from("visitors")
 .select("id, status")
 .eq("access_code", accessCode)
 .eq("resident_id", resident.id)
 .single();

 if (visitorError || !visitor) {
 return Response.json({ error: "Visitor pass was not found." }, { status: 404 });
 }

 const transitionError = validateVisitorRevocation(visitor.status);
 if (transitionError) return Response.json({ error: transitionError }, { status: 409 });

 const { data: updatedVisitor, error: updateError } = await supabaseAdmin
 .from("visitors")
 .update({ status: "revoked" })
 .eq("id", visitor.id)
 .eq("status", "pending")
 .select("status")
 .single();

 if (updateError || !updatedVisitor) {
 return Response.json({ error: "Unable to revoke this access code. Refresh and try again." }, { status: 409 });
 }

 return Response.json({ visitor: updatedVisitor });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to revoke access code." }, { status: 500 });
 }
}
