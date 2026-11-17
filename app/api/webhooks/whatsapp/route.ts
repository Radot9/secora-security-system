import { after } from "next/server";

import { extractWhatsAppWebhook, verifyMetaWebhookSignature } from "@/lib/whatsapp/meta";
import { drainWhatsAppQueue, enqueueWhatsAppMessages, recordWhatsAppDeliveryStatuses } from "@/lib/whatsapp/service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
 const url = new URL(request.url);
 const mode = url.searchParams.get("hub.mode");
 const verifyToken = url.searchParams.get("hub.verify_token");
 const challenge = url.searchParams.get("hub.challenge");

 if (
  mode === "subscribe" &&
  challenge &&
  verifyToken &&
  verifyToken === process.env.WHATSAPP_VERIFY_TOKEN
 ) {
  return new Response(challenge, { status: 200 });
 }

 return Response.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
 const rawBody = await request.text();
 const appSecret = process.env.WHATSAPP_APP_SECRET ?? "";
 const signature = request.headers.get("x-hub-signature-256");

 if (!verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
  return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
 }

 let payload: unknown;
 try {
  payload = JSON.parse(rawBody);
 } catch {
  return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
 }

 const { messages, statuses } = extractWhatsAppWebhook(payload);
 if (messages.length === 0 && statuses.length === 0) {
  return Response.json({ received: true });
 }

 try {
  await Promise.all([enqueueWhatsAppMessages(messages), recordWhatsAppDeliveryStatuses(statuses)]);
  after(async () => {
   await drainWhatsAppQueue(Math.max(messages.length, 1)).catch(() => undefined);
  });
  return Response.json({ received: true });
 } catch (error) {
  console.error("WhatsApp webhook enqueue failed", error instanceof Error ? error.message : "unknown_error");
  return Response.json({ error: "Webhook could not be queued." }, { status: 500 });
 }
}
