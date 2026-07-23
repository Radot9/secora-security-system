import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateVisitorCheckIn } from "@/lib/visitor-status";

export async function POST(
 _request: Request,
 context: RouteContext<"/api/security/visitors/[id]/check-in">,
) {
 try {
 await requireApiRole(["security"]);
 const { id } = await context.params;

 const { data: visitor, error: visitorError } = await supabaseAdmin
 .from("visitors")
 .select("id, status, expires_at")
 .eq("id", id)
 .single();

 if (visitorError || !visitor) {
 return Response.json({ error: "Visitor pass was not found." }, { status: 404 });
 }

 const transitionError = validateVisitorCheckIn({
 status: visitor.status,
 expiresAt: visitor.expires_at,
 });
 if (transitionError) return Response.json({ error: transitionError }, { status: 409 });

 const entryTime = new Date().toISOString();
 const { data: updatedVisitor, error: updateError } = await supabaseAdmin
 .from("visitors")
 .update({ status: "entered", entry_time: entryTime })
 .eq("id", id)
 .eq("status", "pending")
 .select("id, status, entry_time")
 .single();

 if (updateError || !updatedVisitor) {
 return Response.json({ error: "Unable to check in this visitor. Refresh and try again." }, { status: 409 });
 }

 return Response.json({ visitor: updatedVisitor });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to check in visitor." }, { status: 500 });
 }
}
