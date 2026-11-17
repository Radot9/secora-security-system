import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import {
 advanceBotConversation,
 normalizePhoneNumber,
 parseValidityDuration,
} from "../lib/whatsapp/bot.ts";
import { extractIncomingMessages, extractWhatsAppWebhook, verifyMetaWebhookSignature } from "../lib/whatsapp/meta.ts";

test("normalizes registered Nigerian phone numbers to the WhatsApp sender format", () => {
 assert.equal(normalizePhoneNumber("0803 123 4567"), "2348031234567");
 assert.equal(normalizePhoneNumber("+234 (803) 123-4567"), "2348031234567");
 assert.equal(normalizePhoneNumber("123"), null);
});

test("parses supported visitor-pass durations", () => {
 assert.equal(parseValidityDuration("2"), 120);
 assert.equal(parseValidityDuration("2h"), 120);
 assert.equal(parseValidityDuration("24h"), 1440);
 assert.equal(parseValidityDuration("10m"), null);
 assert.equal(parseValidityDuration("8 days"), null);
});

test("starts and advances a visitor-pass conversation", () => {
 const started = advanceBotConversation("idle", {}, "PASS", "Ada");
 assert.equal(started.state, "visitor_name");

 const named = advanceBotConversation(started.state, started.draft, "John Doe", "Ada");
 assert.equal(named.state, "visitor_phone");
 assert.equal(named.draft.visitorName, "John Doe");
});

test("requires explicit confirmation before creating a pass", () => {
 const draft = {
  visitorName: "John Doe",
  visitorPhone: "2348031234567",
  purpose: "Family visit",
  durationMinutes: 60,
  plateNumber: null,
 };
 assert.equal(advanceBotConversation("confirm", draft, "maybe", "Ada").createPass, false);
 assert.equal(advanceBotConversation("confirm", draft, "YES", "Ada").createPass, true);
});

test("verifies Meta webhook signatures against the raw body", () => {
 const body = JSON.stringify({ object: "whatsapp_business_account" });
 const secret = "test-app-secret";
 const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

 assert.equal(verifyMetaWebhookSignature(body, signature, secret), true);
 assert.equal(verifyMetaWebhookSignature(`${body}x`, signature, secret), false);
 assert.equal(verifyMetaWebhookSignature(body, `sha256=${"z".repeat(64)}`, secret), false);
});

test("extracts inbound text messages and ignores status-only webhook events", () => {
 const messages = extractIncomingMessages({
  entry: [{ changes: [{ value: { messages: [{
   id: "wamid.123",
   from: "2348031234567",
   type: "text",
   text: { body: " PASS " },
  }] } }] }],
 });

 assert.deepEqual(messages, [{
  id: "wamid.123",
  from: "2348031234567",
  type: "text",
  text: "PASS",
 }]);
 assert.deepEqual(extractIncomingMessages({ entry: [{ changes: [{ value: { statuses: [] } }] }] }), []);
});

test("extracts interactive replies and delivery statuses", () => {
 const envelope = extractWhatsAppWebhook({
  entry: [{ changes: [{ value: {
   messages: [{ id: "wamid.in", from: "+2348031234567", type: "interactive", interactive: { list_reply: { id: "generate_pass", title: "Generate" } } }],
   statuses: [{ id: "wamid.out", status: "delivered", timestamp: "1700000000" }],
  } }] }],
 });
 assert.equal(envelope.messages[0]?.text, "generate_pass");
 assert.equal(envelope.statuses[0]?.status, "delivered");
});

test("supports the complete resident pass conversation and back navigation", () => {
 let current = advanceBotConversation("idle", {}, "generate_pass", "Ada");
 current = advanceBotConversation(current.state, current.draft, "John Doe", "Ada");
 current = advanceBotConversation(current.state, current.draft, "08031234567", "Ada");
 current = advanceBotConversation(current.state, current.draft, "delivery", "Ada");
 current = advanceBotConversation(current.state, current.draft, "no", "Ada");
 assert.equal(current.state, "duration");
 const backed = advanceBotConversation(current.state, current.draft, "back", "Ada");
 assert.equal(backed.state, "vehicle_choice");
 current = advanceBotConversation(current.state, current.draft, "6", "Ada");
 current = advanceBotConversation(current.state, current.draft, "confirm", "Ada");
 assert.equal(current.action, "create_pass");
 assert.equal(current.createPass, true);
});
