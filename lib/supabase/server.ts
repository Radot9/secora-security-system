import { SESSION_PREFERENCE_COOKIE, sessionCookieOptions } from "@/lib/auth/session-persistence";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
 const cookieStore = await cookies();

 return createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 getAll: () => cookieStore.getAll(),
 setAll: (cookiesToSet) => {
 try {
 cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, sessionCookieOptions(options, cookieStore.get(SESSION_PREFERENCE_COOKIE)?.value !== "no")));
 } catch {
 // Server Components cannot always write cookies. Browser auth refresh handles it.
 }
 },
 },
 }
 );
}
