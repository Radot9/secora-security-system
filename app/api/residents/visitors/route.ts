import { randomUUID } from "node:crypto";

import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createVisitorPass, VisitorPassError } from "@/lib/visitors/pass-service";

export async function POST(request: Request) {
 try {
  const { user } = await requireApiRole(["resident"]);
  const body = await request.json();
  const { data: resident, error } = await supabaseAdmin
   .from("residents")
   .select("id")
   .eq("user_id", user.id)
   .eq("is_active", true)
   .single();

  if (error || !resident) return Response.json({ error: "Resident profile was not found." }, { status: 403 });

  const pass = await createVisitorPass({
   residentId: resident.id,
   actorUserId: user.id,
   requestId: typeof body.requestId === "string" ? body.requestId : randomUUID(),
   visitorName: String(body.visitorName ?? ""),
   visitorPhone: String(body.visitorPhone ?? ""),
   purpose: String(body.purpose ?? ""),
   plateNumber: body.plateNumber == null ? null : String(body.plateNumber),
   validityMinutes: Number(body.validityMinutes),
   creationChannel: "web",
  });

  return Response.json({ visitor: pass }, { status: 201 });
 } catch (error) {
  const authResponse = authorizationResponse(error);
  if (authResponse) return authResponse;
  if (error instanceof VisitorPassError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
  return Response.json({ error: "Unable to generate the visitor pass." }, { status: 500 });
 }
}
