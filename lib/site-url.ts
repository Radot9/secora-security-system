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

