import { createHmac, randomInt } from "node:crypto";

import { normalizePhoneNumber } from "@/lib/whatsapp/bot";

export const LINK_CHALLENGE_TTL_MINUTES = 10;
export const MAX_LINK_ATTEMPTS = 5;
export const MAX_LINKED_USERS_PER_HOUSEHOLD = 5;

function linkingSecret() {
 const secret = process.env.WHATSAPP_LINK_SECRET;
 if (!secret || secret.length < 32) throw new Error("WHATSAPP_LINK_SECRET must contain at least 32 characters.");
 return secret;
}

export function normalizeWhatsAppUserId(value: string) {
 return normalizePhoneNumber(value);
}

export function generateLinkChallenge() {
 return `LINK-${randomInt(100000, 1000000)}`;
}

export function normalizeLinkChallenge(value: string) {
 const match = value.trim().toUpperCase().match(/^LINK[-\s]?(\d{6})$/);
 return match ? `LINK-${match[1]}` : null;
}

export function hashLinkChallenge(value: string) {
 const normalized = normalizeLinkChallenge(value);
 if (!normalized) return null;
 return createHmac("sha256", linkingSecret()).update(normalized).digest("hex");
}
