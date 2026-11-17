import type { CookieOptions } from "@supabase/ssr";

export const SESSION_PREFERENCE_COOKIE = "entriseq-stay-signed-in";

export function sessionCookieOptions(options: CookieOptions, staySignedIn: boolean): CookieOptions {
 if (staySignedIn || options.maxAge === 0) return options;
 const sessionOptions = { ...options };
 delete sessionOptions.maxAge;
 delete sessionOptions.expires;
 return sessionOptions;
}
