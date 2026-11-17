import { timingSafeEqual } from "node:crypto";

import { drainWhatsAppQueue } from "@/lib/whatsapp/service";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
 const expected = process.env.WHATSAPP_WORKER_SECRET;
 const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
 if (!expected || !supplied) return false;
 const expectedBuffer = Buffer.from(expected);
 const suppliedBuffer = Buffer.from(supplied);
 return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: Request) {
 if (!authorized(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
 try {
  return Response.json(await drainWhatsAppQueue(25));
 } catch {
  return Response.json({ error: "Unable to process the WhatsApp queue." }, { status: 500 });
 }
}
