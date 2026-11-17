import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizePhoneNumber } from "@/lib/whatsapp/bot";
import { validateVisitorRevocation } from "@/lib/visitor-status";

export const MINIMUM_PASS_VALIDITY_MINUTES = 30;
export const MAXIMUM_PASS_VALIDITY_MINUTES = 24 * 60;
export const MAXIMUM_ACTIVE_PASSES = 10;
export const MAXIMUM_HOURLY_PASSES = 10;

export type CreateVisitorPassInput = {
 residentId: string;
 actorUserId?: string;
 whatsappIdentityId?: string;
 requestId: string;
 visitorName: string;
 visitorPhone: string;
 purpose: string;
 plateNumber?: string | null;
 validityMinutes: number;
 creationChannel: "web" | "whatsapp";
};

export type CreatedVisitorPass = {
 id: string;
 accessCode: string;
 publicPassToken: string;
 expiresAt: string;
 createdAt: string;
};

export class VisitorPassError extends Error {
 constructor(public code: string, message: string, public status = 400) {
  super(message);
 }
}

const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
 resident_inactive: { message: "Your resident account is inactive.", status: 403 },
 actor_not_authorized: { message: "You are not authorised to create this pass.", status: 403 },
 invalid_visitor_name: { message: "Enter a visitor name between 2 and 100 characters.", status: 400 },
 invalid_visitor_phone: { message: "Enter a valid visitor phone number.", status: 400 },
 invalid_purpose: { message: "Enter a purpose between 2 and 100 characters.", status: 400 },
 invalid_plate_number: { message: "Enter a plate number with no more than 20 characters.", status: 400 },
 invalid_validity: { message: "Pass validity must be between 30 minutes and 24 hours.", status: 400 },
 active_pass_limit: { message: "You already have 10 active visitor passes.", status: 429 },
 hourly_pass_limit: { message: "You have reached the hourly visitor-pass limit.", status: 429 },
 access_code_unavailable: { message: "A visitor code could not be allocated. Please try again.", status: 503 },
};

function validateInput(input: CreateVisitorPassInput) {
 const visitorName = input.visitorName.trim();
 const visitorPhone = normalizePhoneNumber(input.visitorPhone);
 const purpose = input.purpose.trim();
 const plateNumber = input.plateNumber?.trim().toUpperCase() || null;

 if (visitorName.length < 2 || visitorName.length > 100) throw new VisitorPassError("invalid_visitor_name", ERROR_MESSAGES.invalid_visitor_name.message);
 if (!visitorPhone) throw new VisitorPassError("invalid_visitor_phone", ERROR_MESSAGES.invalid_visitor_phone.message);
 if (purpose.length < 2 || purpose.length > 100) throw new VisitorPassError("invalid_purpose", ERROR_MESSAGES.invalid_purpose.message);
 if (plateNumber && plateNumber.length > 20) throw new VisitorPassError("invalid_plate_number", ERROR_MESSAGES.invalid_plate_number.message);
 if (!Number.isInteger(input.validityMinutes) || input.validityMinutes < MINIMUM_PASS_VALIDITY_MINUTES || input.validityMinutes > MAXIMUM_PASS_VALIDITY_MINUTES) {
  throw new VisitorPassError("invalid_validity", ERROR_MESSAGES.invalid_validity.message);
 }
 if (input.creationChannel === "web" && (!input.actorUserId || input.whatsappIdentityId)) {
  throw new VisitorPassError("actor_not_authorized", ERROR_MESSAGES.actor_not_authorized.message, 403);
 }
 if (input.creationChannel === "whatsapp" && (!input.whatsappIdentityId || input.actorUserId)) {
  throw new VisitorPassError("actor_not_authorized", ERROR_MESSAGES.actor_not_authorized.message, 403);
 }

 return { visitorName, visitorPhone, purpose, plateNumber };
}

export async function createVisitorPass(input: CreateVisitorPassInput): Promise<CreatedVisitorPass> {
 const clean = validateInput(input);
 const { data, error } = await supabaseAdmin.rpc("create_visitor_pass", {
  p_resident_id: input.residentId,
  p_actor_user_id: input.actorUserId ?? null,
  p_whatsapp_identity_id: input.whatsappIdentityId ?? null,
  p_request_id: input.requestId,
  p_visitor_name: clean.visitorName,
  p_visitor_phone: clean.visitorPhone,
  p_purpose: clean.purpose,
  p_plate_number: clean.plateNumber,
  p_validity_minutes: input.validityMinutes,
  p_creation_channel: input.creationChannel,
 });

 if (error) {
  const known = Object.entries(ERROR_MESSAGES).find(([code]) => error.message.includes(code));
  if (known) throw new VisitorPassError(known[0], known[1].message, known[1].status);
  throw new VisitorPassError("pass_creation_failed", "We couldn't generate the visitor pass right now.", 500);
 }

 const row = Array.isArray(data) ? data[0] : data;
 if (!row) throw new VisitorPassError("pass_creation_failed", "We couldn't generate the visitor pass right now.", 500);

 return {
  id: row.id,
  accessCode: row.access_code,
  publicPassToken: row.public_pass_token,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
 };
}

export async function revokeVisitorPass(input: {
 residentId: string;
 accessCode: string;
 actorUserId?: string;
 whatsappIdentityId?: string;
 canManageAll?: boolean;
 source: "web" | "whatsapp";
}) {
 const { data: visitor, error } = await supabaseAdmin
  .from("visitors")
  .select("id, status, created_by_whatsapp_identity_id")
  .eq("access_code", input.accessCode)
  .eq("resident_id", input.residentId)
  .single();

 if (error || !visitor) throw new VisitorPassError("pass_not_found", "Visitor pass was not found.", 404);
 if (input.whatsappIdentityId && !input.canManageAll && visitor.created_by_whatsapp_identity_id !== input.whatsappIdentityId) {
  throw new VisitorPassError("actor_not_authorized", "You cannot revoke this visitor pass.", 403);
 }

 const transitionError = validateVisitorRevocation(visitor.status);
 if (transitionError) throw new VisitorPassError("invalid_status", transitionError, 409);

 const { data: updated, error: updateError } = await supabaseAdmin
  .from("visitors")
  .update({ status: "revoked" })
  .eq("id", visitor.id)
  .eq("status", "pending")
  .select("id, status")
  .single();

 if (updateError || !updated) throw new VisitorPassError("revocation_conflict", "Unable to revoke this pass. Refresh and try again.", 409);

 await supabaseAdmin.from("visitor_audit_events").insert({
  resident_id: input.residentId,
  visitor_id: visitor.id,
  actor_user_id: input.actorUserId ?? null,
  whatsapp_identity_id: input.whatsappIdentityId ?? null,
  action: "visitor_pass_revoked",
  source: input.source,
  outcome: "success",
 });

 return updated;
}
