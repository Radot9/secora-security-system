import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";

export async function GET() {
 try {
 await requireApiRole(["super_admin"]);
 const csv = await readFile(join(process.cwd(), "lib", "Entriseq Early Tester Registration (Responses) - Form responses 1.csv"), "utf8");
 return Response.json({ csv }, { headers: { "Cache-Control": "no-store, private" } });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to load the pilot tester spreadsheet." }, { status: 500 });
 }
}
