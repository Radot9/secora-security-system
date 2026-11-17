import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revokeVisitorPass, VisitorPassError } from "@/lib/visitors/pass-service";

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

 const updatedVisitor = await revokeVisitorPass({
  residentId: resident.id,
  accessCode,
  actorUserId: user.id,
  source: "web",
 });

 return Response.json({ visitor: updatedVisitor });
 } catch (error) {
 const authResponse = authorizationResponse(error);
 if (authResponse) return authResponse;
 if (error instanceof VisitorPassError) return Response.json({ error: error.message }, { status: error.status });
 return Response.json({ error: "Unable to revoke access code." }, { status: 500 });
 }
}
