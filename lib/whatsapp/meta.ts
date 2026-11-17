import { createHmac, timingSafeEqual } from "node:crypto";

export type IncomingWhatsAppMessage = { id: string; from: string; type: string; text: string | null };
export type WhatsAppDeliveryStatus = { id: string; status: "sent" | "delivered" | "read" | "failed"; timestamp?: string; errorCode?: string };

type MetaWebhookPayload = {
 entry?: Array<{ changes?: Array<{ value?: {
  messages?: Array<{
   id?: string; from?: string; type?: string;
   text?: { body?: string };
   interactive?: { button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string } };
   button?: { payload?: string; text?: string };
  }>;
  statuses?: Array<{ id?: string; status?: string; timestamp?: string; errors?: Array<{ code?: number | string }> }>;
 } }> }>;
};

export function verifyMetaWebhookSignature(rawBody: string, signature: string | null, appSecret: string) {
 if (!signature?.startsWith("sha256=") || !appSecret) return false;
 const suppliedDigest = signature.slice("sha256=".length);
 if (!/^[a-f0-9]{64}$/i.test(suppliedDigest)) return false;
 const expectedDigest = createHmac("sha256", appSecret).update(rawBody).digest("hex");
 return timingSafeEqual(Buffer.from(suppliedDigest, "hex"), Buffer.from(expectedDigest, "hex"));
}

export function extractWhatsAppWebhook(rawPayload: unknown) {
 const messages: IncomingWhatsAppMessage[] = [];
 const statuses: WhatsAppDeliveryStatus[] = [];
 if (!rawPayload || typeof rawPayload !== "object") return { messages, statuses };

 for (const entry of (rawPayload as MetaWebhookPayload).entry ?? []) {
  for (const change of entry.changes ?? []) {
   for (const message of change.value?.messages ?? []) {
    if (!message.id || !message.from) continue;
    const interactiveText = message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id;
    const buttonText = message.button?.payload ?? message.button?.text;
    messages.push({
     id: message.id,
     from: message.from.replace(/\D/g, ""),
     type: message.type ?? "unknown",
     text: message.type === "text" ? message.text?.body?.trim() || null : interactiveText ?? buttonText ?? null,
    });
   }
   for (const status of change.value?.statuses ?? []) {
    if (!status.id || !["sent", "delivered", "read", "failed"].includes(status.status ?? "")) continue;
    statuses.push({
     id: status.id,
     status: status.status as WhatsAppDeliveryStatus["status"],
     timestamp: status.timestamp,
     errorCode: status.errors?.[0]?.code == null ? undefined : String(status.errors[0].code),
    });
   }
  }
 }
 return { messages, statuses };
}

export function extractIncomingMessages(rawPayload: unknown) {
 return extractWhatsAppWebhook(rawPayload).messages;
}

function requireWhatsAppEnvironment() {
 const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
 const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
 const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
 if (!accessToken || !phoneNumberId || !graphApiVersion) throw new Error("WhatsApp Cloud API environment variables are incomplete.");
 return { accessToken, phoneNumberId, graphApiVersion };
}

async function sendWhatsAppPayload(payload: Record<string, unknown>) {
 const { accessToken, phoneNumberId, graphApiVersion } = requireWhatsAppEnvironment();
 const response = await fetch(`https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
 });
 if (!response.ok) throw new Error(`WhatsApp send failed (${response.status}).`);
 const body = await response.json() as { messages?: Array<{ id?: string }> };
 const messageId = body.messages?.[0]?.id;
 if (!messageId) throw new Error("WhatsApp did not return a message identifier.");
 return messageId;
}

export function sendWhatsAppText(to: string, body: string) {
 return sendWhatsAppPayload({ to, type: "text", text: { body, preview_url: true } });
}

export function sendWhatsAppMainMenu(to: string, greeting: string) {
 return sendWhatsAppPayload({
  to,
  type: "interactive",
  interactive: {
   type: "list",
   body: { text: `${greeting}\n\nWhat would you like to do?` },
   action: {
    button: "Open menu",
    sections: [{ title: "Visitor passes", rows: [
     { id: "generate_pass", title: "Generate Visitor Pass" },
     { id: "active_passes", title: "View Active Passes" },
     { id: "revoke_pass", title: "Revoke Visitor Pass" },
     { id: "help", title: "Contact Security / Help" },
    ] }],
   },
  },
 });
}

export function sendWhatsAppButtons(to: string, body: string, buttons: Array<{ id: string; title: string }>) {
 return sendWhatsAppPayload({
  to,
  type: "interactive",
  interactive: { type: "button", body: { text: body }, action: { buttons: buttons.slice(0, 3).map((button) => ({ type: "reply", reply: button })) } },
 });
}

export function sendWhatsAppList(to: string, body: string, button: string, rows: Array<{ id: string; title: string; description?: string }>) {
 return sendWhatsAppPayload({
  to,
  type: "interactive",
  interactive: {
   type: "list",
   body: { text: body },
   action: { button, sections: [{ title: "Choose an option", rows: rows.slice(0, 10) }] },
  },
 });
}
