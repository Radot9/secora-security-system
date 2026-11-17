import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
 const { token } = await params;
 if (!/^[a-f0-9]{48}$/i.test(token)) return Response.json({ error: "Visitor pass was not found." }, { status: 404 });

 const { data, error } = await supabaseAdmin
  .from("visitors")
  .select("visitor_name, access_code, status, expires_at")
  .eq("public_pass_token", token.toLowerCase())
  .maybeSingle();

 if (error || !data) return Response.json({ error: "Visitor pass was not found." }, { status: 404 });
 return Response.json({ visitor: data }, { headers: { "Cache-Control": "private, no-store" } });
}
