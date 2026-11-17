import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
 generateLinkChallenge,
 hashLinkChallenge,
 LINK_CHALLENGE_TTL_MINUTES,
 MAX_LINK_ATTEMPTS,
 normalizeWhatsAppUserId,
} from "@/lib/whatsapp/linking";

async function residentForUser(userId: string) {
 const { data, error } = await supabaseAdmin
  .from("residents")
  .select("id, phone")
  .eq("user_id", userId)
  .eq("is_active", true)
  .single();
 if (error || !data) return null;
 return data;
}

export async function GET() {
 try {
  const { user } = await requireApiRole(["resident"]);
  const resident = await residentForUser(user.id);
  if (!resident) return Response.json({ error: "Resident profile was not found." }, { status: 403 });

  const { data: identity } = await supabaseAdmin
   .from("whatsapp_identities")
   .select("whatsapp_user_id, status, verified_at")
   .eq("resident_id", resident.id)
   .eq("identity_type", "resident")
   .order("created_at", { ascending: false })
   .limit(1)
   .maybeSingle();

  return Response.json({
   phone: resident.phone,
   identity: identity ? {
    phone: `+${identity.whatsapp_user_id}`,
    status: identity.status,
    verifiedAt: identity.verified_at,
   } : null,
  });
 } catch (error) {
  return authorizationResponse(error) ?? Response.json({ error: "Unable to load WhatsApp settings." }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
  const { user } = await requireApiRole(["resident"]);
  const resident = await residentForUser(user.id);
  if (!resident) return Response.json({ error: "Resident profile was not found." }, { status: 403 });

  const body = await request.json();
  const whatsappUserId = normalizeWhatsAppUserId(String(body.phone ?? ""));
  if (!whatsappUserId) return Response.json({ error: "Enter a valid WhatsApp phone number." }, { status: 400 });

  const { data: existingResidentIdentity } = await supabaseAdmin
   .from("whatsapp_identities")
   .select("whatsapp_user_id")
   .eq("resident_id", resident.id)
   .eq("identity_type", "resident")
   .eq("status", "active")
   .maybeSingle();
  if (existingResidentIdentity && existingResidentIdentity.whatsapp_user_id !== whatsappUserId) {
   return Response.json({ error: "Disconnect the currently linked number before connecting a new one." }, { status: 409 });
  }

  const { data: claimedIdentity } = await supabaseAdmin
   .from("whatsapp_identities")
   .select("resident_id, status")
   .eq("whatsapp_user_id", whatsappUserId)
   .maybeSingle();
  if (claimedIdentity?.status === "active" && claimedIdentity.resident_id !== resident.id) {
   return Response.json({ error: "This WhatsApp number is already linked to another account." }, { status: 409 });
  }

  const challenge = generateLinkChallenge();
  const tokenHash = hashLinkChallenge(challenge);
  if (!tokenHash) throw new Error("Unable to hash link challenge.");

  await supabaseAdmin
   .from("whatsapp_link_challenges")
   .delete()
   .eq("resident_id", resident.id)
   .is("consumed_at", null);

  const expiresAt = new Date(Date.now() + LINK_CHALLENGE_TTL_MINUTES * 60_000).toISOString();
  const { error } = await supabaseAdmin.from("whatsapp_link_challenges").insert({
   resident_id: resident.id,
   target_whatsapp_user_id: whatsappUserId,
   token_hash: tokenHash,
   expires_at: expiresAt,
   max_attempts: MAX_LINK_ATTEMPTS,
   created_by: user.id,
  });
  if (error) throw error;

  await supabaseAdmin.from("visitor_audit_events").insert({
   resident_id: resident.id,
   actor_user_id: user.id,
   action: "whatsapp_link_requested",
   source: "web",
   outcome: "success",
  });

  return Response.json({ challenge, expiresAt, phone: `+${whatsappUserId}` }, { status: 201 });
 } catch (error) {
  return authorizationResponse(error) ?? Response.json({ error: "Unable to create a WhatsApp linking code." }, { status: 500 });
 }
}

export async function DELETE() {
 try {
  const { user } = await requireApiRole(["resident"]);
  const resident = await residentForUser(user.id);
  if (!resident) return Response.json({ error: "Resident profile was not found." }, { status: 403 });

  const revokedAt = new Date().toISOString();
  const { error } = await supabaseAdmin
   .from("whatsapp_identities")
   .update({ status: "revoked", revoked_at: revokedAt, updated_at: revokedAt })
   .eq("resident_id", resident.id)
   .eq("identity_type", "resident")
   .eq("status", "active");
  if (error) throw error;

  await supabaseAdmin.from("whatsapp_conversations").delete().eq("resident_id", resident.id);
  await supabaseAdmin.from("visitor_audit_events").insert({
   resident_id: resident.id,
   actor_user_id: user.id,
   action: "whatsapp_access_revoked",
   source: "web",
   outcome: "success",
  });

  return Response.json({ revoked: true });
 } catch (error) {
  return authorizationResponse(error) ?? Response.json({ error: "Unable to disconnect WhatsApp." }, { status: 500 });
 }
}
