import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { SESSION_PREFERENCE_COOKIE, sessionCookieOptions } from "@/lib/auth/session-persistence";

export function setStaySignedIn(staySignedIn: boolean) {
 document.cookie = serializeCookieHeader(SESSION_PREFERENCE_COOKIE, staySignedIn ? "yes" : "no", {
  path: "/", sameSite: "lax", secure: window.location.protocol === "https:",
  ...(staySignedIn ? { maxAge: 60 * 60 * 24 * 30 } : {}),
 });
 // Apply the preference to existing auth cookies as well as future refreshes.
 for (const { name, value } of parseCookieHeader(document.cookie)) {
  if (!name.startsWith("sb-") || !name.includes("-auth-token")) continue;
  document.cookie = serializeCookieHeader(name, value ?? "", {
   path: "/", sameSite: "lax", secure: window.location.protocol === "https:",
   ...(staySignedIn ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
 }
}

export const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
  auth: { experimental: { passkey: true } },
  cookies: {
   getAll: () => typeof document === "undefined" ? [] : parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? "" })),
   setAll: (cookies) => {
    const staySignedIn = parseCookieHeader(document.cookie).find((cookie) => cookie.name === SESSION_PREFERENCE_COOKIE)?.value !== "no";
    for (const { name, value, options } of cookies) {
     document.cookie = serializeCookieHeader(name, value, sessionCookieOptions(options, staySignedIn));
    }
   },
  },
 },
);
