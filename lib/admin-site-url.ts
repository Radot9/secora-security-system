import { getPublicSiteOrigin } from "@/lib/site-url";

function isLoopback(hostname: string) {
 return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname.toLowerCase());
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
