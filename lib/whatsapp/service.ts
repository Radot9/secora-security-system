import { timingSafeEqual } from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createVisitorPass, revokeVisitorPass, VisitorPassError } from "@/lib/visitors/pass-service";
import {
 advanceBotConversation,
 formatValidityDuration,
 type WhatsAppConversationState,
 type WhatsAppPassDraft,
} from "@/lib/whatsapp/bot";
import { hashLinkChallenge, normalizeLinkChallenge } from "@/lib/whatsapp/linking";
import {
 sendWhatsAppButtons,
 sendWhatsAppList,
 sendWhatsAppMainMenu,
 sendWhatsAppText,
 type IncomingWhatsAppMessage,
 type WhatsAppDeliveryStatus,
} from "@/lib/whatsapp/meta";

type Identity = { id: string; resident_id: string; whatsapp_user_id: string; permissions: Record<string, boolean> | null };
type Resident = { id: string; full_name: string | null; is_active: boolean | null };
type QueuedEvent = { message_id: string; sender_phone: string; message_type: string | null; message_text: string | null; attempt_count: number };

const SESSION_TTL_MINUTES = 30;
const DEFAULT_MONTHLY_MESSAGE_LIMIT = 900;

function monthlyMessageLimit() {
 const configured = Number(process.env.WHATSAPP_MONTHLY_MESSAGE_LIMIT ?? DEFAULT_MONTHLY_MESSAGE_LIMIT);
 return Number.isInteger(configured) && configured > 0 ? Math.min(configured, 1000) : DEFAULT_MONTHLY_MESSAGE_LIMIT;
}

async function sendTracked(input: {
 to: string;
 inboundMessageId: string;
 identityId?: string;
 kind: "text" | "interactive";
 send: () => Promise<string>;
}) {
 const { data: existing } = await supabaseAdmin
  .from("whatsapp_outbound_messages")
  .select("id, status, meta_message_id")
  .eq("inbound_message_id", input.inboundMessageId)
  .maybeSingle();
 if (existing && ["sent", "delivered", "read"].includes(existing.status)) return existing.meta_message_id ?? existing.id;

 let reservedId = existing?.id as string | undefined;
 if (!reservedId) {
  const { data, error: reserveError } = await supabaseAdmin.rpc("reserve_whatsapp_outbound_message", {
   p_inbound_message_id: input.inboundMessageId,
   p_identity_id: input.identityId ?? null,
   p_recipient_whatsapp_user_id: input.to,
   p_message_kind: input.kind,
   p_monthly_limit: monthlyMessageLimit(),
  });
  if (reserveError) throw reserveError;
  reservedId = data as string | undefined;
 }
 if (!reservedId) throw new Error("Unable to reserve WhatsApp message budget.");

 try {
  const metaMessageId = await input.send();
  await supabaseAdmin.from("whatsapp_outbound_messages").update({
   meta_message_id: metaMessageId,
   status: "sent",
   sent_at: new Date().toISOString(),
  }).eq("id", reservedId);
  return metaMessageId;
 } catch (error) {
  await supabaseAdmin.from("whatsapp_outbound_messages").update({
   status: "failed",
   failed_at: new Date().toISOString(),
   error_code: error instanceof Error ? error.message.slice(0, 100) : "send_failed",
  }).eq("id", reservedId);
  throw error;
 }
}

async function sendText(message: IncomingWhatsAppMessage, body: string, identityId?: string) {
 return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "text", send: () => sendWhatsAppText(message.from, body) });
}

async function sendMenu(message: IncomingWhatsAppMessage, greeting: string, identityId?: string) {
 return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "interactive", send: () => sendWhatsAppMainMenu(message.from, greeting) });
}

async function sendTransition(message: IncomingWhatsAppMessage, identityId: string, state: WhatsAppConversationState, response: string) {
 if (state === "purpose") {
  return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "interactive", send: () => sendWhatsAppList(message.from, response, "Choose purpose", [
   { id: "personal_visit", title: "Personal Visit" }, { id: "delivery", title: "Delivery" },
   { id: "maintenance", title: "Maintenance" }, { id: "business", title: "Business" }, { id: "other", title: "Other" },
  ]) });
 }
 if (state === "vehicle_choice") {
  return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "interactive", send: () => sendWhatsAppButtons(message.from, response, [{ id: "yes", title: "Yes" }, { id: "no", title: "No" }, { id: "cancel", title: "Cancel" }]) });
 }
 if (state === "confirm") {
  return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "interactive", send: () => sendWhatsAppButtons(message.from, response, [{ id: "confirm", title: "Confirm & Generate" }, { id: "back", title: "Back" }, { id: "cancel", title: "Cancel" }]) });
 }
 if (state === "duration") {
  return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "interactive", send: () => sendWhatsAppList(message.from, response, "Choose validity", [
   { id: "2h", title: "2 Hours" }, { id: "6h", title: "6 Hours" }, { id: "12h", title: "12 Hours" }, { id: "24h", title: "24 Hours" },
  ]) });
 }
 if (state === "revoke_confirm") {
  return sendTracked({ to: message.from, inboundMessageId: message.id, identityId, kind: "interactive", send: () => sendWhatsAppButtons(message.from, response, [{ id: "revoke", title: "Revoke Pass" }, { id: "cancel", title: "Cancel" }]) });
 }
 return sendText(message, response, identityId);
}

export async function enqueueWhatsAppMessages(messages: IncomingWhatsAppMessage[]) {
 for (const message of messages) {
  const { error } = await supabaseAdmin.from("whatsapp_webhook_events").insert({
   message_id: message.id,
   sender_phone: message.from,
   message_type: message.type,
   message_text: message.text,
   status: "queued",
  });
  if (error && error.code !== "23505") throw error;
 }
}

export async function recordWhatsAppDeliveryStatuses(statuses: WhatsAppDeliveryStatus[]) {
 for (const status of statuses) {
  const values: Record<string, string | null> = { status: status.status, error_code: status.errorCode ?? null };
  const timestamp = status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString();
  if (status.status === "delivered") values.delivered_at = timestamp;
  if (status.status === "read") values.read_at = timestamp;
  if (status.status === "failed") values.failed_at = timestamp;
  await supabaseAdmin.from("whatsapp_outbound_messages").update(values).eq("meta_message_id", status.id);
 }
}

async function consumeLinkChallenge(message: IncomingWhatsAppMessage) {
 const challenge = message.text ? normalizeLinkChallenge(message.text) : null;
 if (!challenge) return false;
 const tokenHash = hashLinkChallenge(challenge);
 if (!tokenHash) return false;

 const { data: link } = await supabaseAdmin
  .from("whatsapp_link_challenges")
  .select("id, resident_id, created_by, attempts, max_attempts, expires_at, token_hash")
  .eq("target_whatsapp_user_id", message.from)
  .is("consumed_at", null)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

 const matches = link && tokenHash.length === link.token_hash.length && timingSafeEqual(Buffer.from(tokenHash), Buffer.from(link.token_hash));
 if (!link || !matches || new Date(link.expires_at).getTime() <= Date.now() || link.attempts >= link.max_attempts) {
  if (link && link.attempts < link.max_attempts) {
   await supabaseAdmin.from("whatsapp_link_challenges").update({ attempts: link.attempts + 1 }).eq("id", link.id).is("consumed_at", null);
  }
  await sendText(message, "This linking code is invalid or expired. Sign in to Entriseq and create a new code.");
  return true;
 }

 const consumedAt = new Date().toISOString();
 const { data: consumed, error: consumeError } = await supabaseAdmin
  .from("whatsapp_link_challenges")
  .update({ consumed_at: consumedAt, attempts: link.attempts + 1 })
  .eq("id", link.id)
  .is("consumed_at", null)
  .select("id")
  .maybeSingle();
 if (consumeError || !consumed) {
  await sendText(message, "This linking code has already been used. Create a new code in Entriseq if needed.");
  return true;
 }

 const { data: identity, error: identityError } = await supabaseAdmin
  .from("whatsapp_identities")
  .upsert({
   resident_id: link.resident_id,
   whatsapp_user_id: message.from,
   identity_type: "resident",
   permissions: { create_pass: true, view_own_passes: true, revoke_own_passes: true, view_all_passes: true, revoke_all_passes: true },
   status: "active",
   verified_at: consumedAt,
   revoked_at: null,
   created_by: link.created_by,
   updated_at: consumedAt,
  }, { onConflict: "whatsapp_user_id" })
  .select("id")
  .single();
 if (identityError) throw identityError;

 await supabaseAdmin.from("visitor_audit_events").insert({
  resident_id: link.resident_id,
  whatsapp_identity_id: identity.id,
  actor_user_id: link.created_by,
  action: "whatsapp_identity_linked",
  source: "whatsapp",
  outcome: "success",
 });
 await sendMenu(message, "Your WhatsApp number is now securely linked to Entriseq.", identity.id);
 return true;
}

async function findActiveIdentity(sender: string) {
 const { data: identity, error } = await supabaseAdmin
  .from("whatsapp_identities")
  .select("id, resident_id, whatsapp_user_id, permissions")
  .eq("whatsapp_user_id", sender)
  .eq("status", "active")
  .maybeSingle<Identity>();
 if (error) throw error;
 if (!identity) return null;

 const { data: resident, error: residentError } = await supabaseAdmin
  .from("residents")
  .select("id, full_name, is_active")
  .eq("id", identity.resident_id)
  .eq("is_active", true)
  .maybeSingle<Resident>();
 if (residentError) throw residentError;
 return resident ? { identity, resident } : null;
}

async function loadConversation(sender: string) {
 const { data, error } = await supabaseAdmin
  .from("whatsapp_conversations")
  .select("state, draft, expires_at")
  .eq("sender_phone", sender)
  .maybeSingle();
 if (error) throw error;
 if (!data || !data.expires_at || new Date(data.expires_at).getTime() <= Date.now()) return { state: "idle" as const, draft: {} };
 return { state: data.state as WhatsAppConversationState, draft: (data.draft ?? {}) as WhatsAppPassDraft };
}

async function saveConversation(sender: string, identity: Identity, state: WhatsAppConversationState, draft: WhatsAppPassDraft) {
 const now = new Date();
 const { error } = await supabaseAdmin.from("whatsapp_conversations").upsert({
  sender_phone: sender,
  resident_id: identity.resident_id,
  identity_id: identity.id,
  state,
  draft,
  invalid_attempts: 0,
  expires_at: new Date(now.getTime() + SESSION_TTL_MINUTES * 60_000).toISOString(),
  updated_at: now.toISOString(),
 }, { onConflict: "sender_phone" });
 if (error) throw error;
}

async function listActivePasses(message: IncomingWhatsAppMessage, identity: Identity, promptForRevoke = false) {
 let query = supabaseAdmin.from("visitors")
  .select("visitor_name, access_code, status, expires_at, public_pass_token")
  .eq("resident_id", identity.resident_id)
  .eq("status", "pending")
  .gt("expires_at", new Date().toISOString())
  .order("expires_at", { ascending: true })
  .limit(10);
 if (identity.permissions?.view_all_passes !== true) query = query.eq("created_by_whatsapp_identity_id", identity.id);
 const { data, error } = await query;
 if (error) throw error;
 if (!data?.length) return sendText(message, "You have no active WhatsApp visitor passes. Reply MENU to continue.", identity.id);
 const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
 const lines = data.flatMap((pass, index) => [
  `${index + 1}. ${pass.visitor_name} — ${pass.access_code}`,
  `Expires ${new Date(pass.expires_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`,
  siteUrl ? `${siteUrl}/visitor-pass?token=${pass.public_pass_token}` : "",
 ]).filter(Boolean);
 const instruction = promptForRevoke
  ? "Reply with the six-digit code you want to revoke, or CANCEL."
  : "Reply REVOKE to revoke a pass, or MENU.";
 return sendText(message, `Your active visitor passes:\n\n${lines.join("\n")}\n\n${instruction}`, identity.id);
}

async function processQueuedEvent(event: QueuedEvent) {
 const message: IncomingWhatsAppMessage = { id: event.message_id, from: event.sender_phone, type: event.message_type ?? "unknown", text: event.message_text };
 const linked = await findActiveIdentity(message.from);

 if (!linked) {
  const linkHandled = await consumeLinkChallenge(message);
  if (!linkHandled) {
   const { count } = await supabaseAdmin
    .from("whatsapp_webhook_events")
    .select("message_id", { count: "exact", head: true })
    .eq("sender_phone", message.from)
    .eq("action", "unregistered")
    .gte("received_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString());
   if ((count ?? 0) === 0) await sendText(message, "This number is not linked to Entriseq. Sign in to Entriseq, open Settings, and choose Connect WhatsApp.");
  }
  return { identityId: null, action: linkHandled ? "link_identity" : "unregistered", outcome: linkHandled ? "success" : "denied" };
 }

 if (!message.text) {
  await sendText(message, "Please use the menu or send a text message.", linked.identity.id);
  return { identityId: linked.identity.id, action: "unsupported_message", outcome: "denied" };
 }

 const conversation = await loadConversation(message.from);
 const next = advanceBotConversation(conversation.state, conversation.draft, message.text, linked.resident.full_name || "Resident");

 if (next.action === "menu") {
  await saveConversation(message.from, linked.identity, "idle", {});
  await sendMenu(message, next.response, linked.identity.id);
 } else if (next.action === "help") {
  const contact = process.env.ESTATE_SECURITY_CONTACT?.trim();
  await sendText(message, contact ? `For help, contact estate security: ${contact}` : "For help, please contact the estate security office or use the Entriseq website.", linked.identity.id);
 } else if (next.action === "list_passes") {
  await saveConversation(message.from, linked.identity, "idle", {});
  await listActivePasses(message, linked.identity);
 } else if (next.action === "start_revoke") {
  await saveConversation(message.from, linked.identity, "revoke_select", {});
  await listActivePasses(message, linked.identity, true);
 } else if (next.action === "confirm_revoke") {
  const accessCode = next.draft.selectedAccessCode;
  if (!accessCode) throw new Error("Missing access code for revocation.");
  await revokeVisitorPass({
   residentId: linked.resident.id,
   accessCode,
   whatsappIdentityId: linked.identity.id,
   canManageAll: linked.identity.permissions?.revoke_all_passes === true,
   source: "whatsapp",
  });
  await saveConversation(message.from, linked.identity, "idle", {});
  await sendText(message, `Visitor pass ${accessCode} has been revoked. It can no longer be used for entry.`, linked.identity.id);
 } else if (next.action === "create_pass") {
  const draft = next.draft;
  if (!draft.visitorName || !draft.visitorPhone || !draft.purpose || !draft.durationMinutes) throw new Error("Incomplete visitor pass draft.");
  const pass = await createVisitorPass({
   residentId: linked.resident.id,
   whatsappIdentityId: linked.identity.id,
   requestId: message.id,
   visitorName: draft.visitorName,
   visitorPhone: draft.visitorPhone,
   purpose: draft.purpose,
   plateNumber: draft.plateNumber,
   validityMinutes: draft.durationMinutes,
   creationChannel: "whatsapp",
  });
  await saveConversation(message.from, linked.identity, "idle", {});
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const response = [
   "Visitor Pass Generated Successfully ✅",
   `Visitor: ${draft.visitorName}`,
   `Access Code: ${pass.accessCode}`,
   `Valid for: ${formatValidityDuration(draft.durationMinutes)}`,
   `Expires: ${new Date(pass.expiresAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`,
   siteUrl ? `QR pass: ${siteUrl}/visitor-pass?token=${pass.publicPassToken}` : "",
  ].filter(Boolean).join("\n");
  await sendText(message, response, linked.identity.id);
 } else {
  await saveConversation(message.from, linked.identity, next.state, next.draft);
  await sendTransition(message, linked.identity.id, next.state, next.response);
 }

 return { identityId: linked.identity.id, action: next.action === "none" ? next.state : next.action, outcome: "success" };
}

export async function drainWhatsAppQueue(limit = 10) {
 await supabaseAdmin
  .from("whatsapp_webhook_events")
  .update({ status: "failed", available_at: new Date().toISOString(), error_message: "stale_processing_recovered" })
  .eq("status", "processing")
  .lt("processing_started_at", new Date(Date.now() - 5 * 60_000).toISOString());

 const { data: events, error } = await supabaseAdmin
  .from("whatsapp_webhook_events")
  .select("message_id, sender_phone, message_type, message_text, attempt_count")
  .in("status", ["queued", "failed"])
  .lte("available_at", new Date().toISOString())
  .order("received_at", { ascending: true })
  .limit(limit);
 if (error) throw error;

 let processed = 0;
 for (const event of (events ?? []) as QueuedEvent[]) {
  const { data: claimed } = await supabaseAdmin.from("whatsapp_webhook_events")
   .update({ status: "processing", processing_started_at: new Date().toISOString(), attempt_count: event.attempt_count + 1 })
   .eq("message_id", event.message_id)
   .in("status", ["queued", "failed"])
   .select("message_id")
   .maybeSingle();
  if (!claimed) continue;

  try {
   const result = await processQueuedEvent(event);
   await supabaseAdmin.from("whatsapp_webhook_events").update({
    status: result.outcome === "denied" ? "rejected" : "processed",
    identity_id: result.identityId,
    action: result.action,
    outcome: result.outcome,
    processed_at: new Date().toISOString(),
    message_text: null,
    error_message: null,
   }).eq("message_id", event.message_id);
   processed += 1;
  } catch (error) {
   const attempt = event.attempt_count + 1;
   const dead = attempt >= 5 || error instanceof VisitorPassError;
   await supabaseAdmin.from("whatsapp_webhook_events").update({
    status: dead ? "dead_letter" : "failed",
    outcome: "failed",
    error_message: error instanceof Error ? error.message.slice(0, 200) : "processing_failed",
    available_at: new Date(Date.now() + Math.min(60, 2 ** attempt) * 60_000).toISOString(),
    message_text: dead ? null : event.message_text,
    processed_at: dead ? new Date().toISOString() : null,
   }).eq("message_id", event.message_id);
  }
 }
 return { processed, examined: events?.length ?? 0 };
}

export async function processIncomingWhatsAppMessage(message: IncomingWhatsAppMessage) {
 await enqueueWhatsAppMessages([message]);
 return drainWhatsAppQueue(1);
}
