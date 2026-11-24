const DEFAULT_SITE_ORIGIN = "https://entriseq.com";

function isLoopback(hostname: string) {
 return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname.toLowerCase());
}

export function getPublicSiteOrigin(...origins: (string | undefined)[]) {
 for (const origin of origins) {
 if (!origin) continue;
 try {
 const url = new URL(origin);
 if ((url.protocol === "http:" || url.protocol === "https:") && !isLoopback(url.hostname)) {
 return url.origin;
 }
 } catch {
 // Try the next configured origin.
 }
 }
 return DEFAULT_SITE_ORIGIN;
}

export function getAdministratorOnboardingRedirect(requestUrl: string) {
 const requestOrigin = new URL(requestUrl).origin;
 const publicOrigin = getPublicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, requestOrigin);
 const configuredRedirect = process.env.SUPABASE_ADMIN_REDIRECT_URL?.trim();
 if (configuredRedirect) {
 try {
 const redirect = new URL(configuredRedirect);
 if (!isLoopback(redirect.hostname)) return redirect.toString();
 } catch {
 // Fall back to the public onboarding page if the configured URL is malformed.
 }
 }
 return new URL("/administrator-onboarding", publicOrigin).toString();
}
