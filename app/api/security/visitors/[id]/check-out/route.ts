import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateVisitorCheckOut } from "@/lib/visitor-status";

export async function POST(
 _request: Request,
 context: RouteContext<"/api/security/visitors/[id]/check-out">,
) {
 try {
 await requireApiRole(["security"]);
 const { id } = await context.params;

 const { data: visitor, error: visitorError } = await supabaseAdmin
 .from("visitors")
 .select("id, status")
 .eq("id", id)
 .single();

 if (visitorError || !visitor) {
 return Response.json({ error: "Visitor pass was not found." }, { status: 404 });
 }

 const transitionError = validateVisitorCheckOut(visitor.status);
 if (transitionError) return Response.json({ error: transitionError }, { status: 409 });

 const exitTime = new Date().toISOString();
 const { data: updatedVisitor, error: updateError } = await supabaseAdmin
 .from("visitors")
 .update({ status: "exited", exit_time: exitTime })
 .eq("id", id)
 .eq("status", "entered")
 .select("id, status, exit_time")
 .single();

 if (updateError || !updatedVisitor) {
 return Response.json({ error: "Unable to check out this visitor. Refresh and try again." }, { status: 409 });
 }

 return Response.json({ visitor: updatedVisitor });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to check out visitor." }, { status: 500 });
 }
}
