import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateVisitorCheckOut } from "@/lib/visitor-status";

export async function POST(
 _request: Request,
 context: RouteContext<"/api/security/visitors/[id]/check-out">,
) {
 try {
 const { id } = await context.params;
 const [{ profile }, { data: visitor, error: visitorError }] = await Promise.all([
 requireApiRole(["security"]),
 supabaseAdmin
 .from("visitors")
 .select("id, status")
 .eq("id", id)
 .single(),
 ]);

 if (visitorError || !visitor) {
 return Response.json({ error: "Visitor pass was not found." }, { status: 404 });
 }

 const transitionError = validateVisitorCheckOut(visitor.status);
 if (transitionError) return Response.json({ error: transitionError }, { status: 409 });

 const exitTime = new Date().toISOString();
 const { data: updatedVisitor, error: updateError } = await supabaseAdmin
 .from("visitors")
 .update({
 status: "exited",
 exit_time: exitTime,
 checked_out_by: profile.id,
 checked_out_by_name: profile.full_name,
 })
 .eq("id", id)
 .eq("status", "entered")
 .select("id, status, exit_time, checked_out_by, checked_out_by_name")
 .single();

 if (updateError || !updatedVisitor) {
 return Response.json({ error: "Unable to check out this visitor. Refresh and try again." }, { status: 409 });
 }

 return Response.json({ visitor: updatedVisitor });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to check out visitor." }, { status: 500 });
 }
}
