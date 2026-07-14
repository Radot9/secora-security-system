import type { SupabaseClient, User } from "@supabase/supabase-js";

type EmailLinkSessionResult = {
  user: User | null;
  error?: string;
};

function cleanUrl(options: { removeCode?: boolean; removeHash?: boolean } = {}) {
  const url = new URL(window.location.href);

  if (options.removeCode) {
    url.searchParams.delete("code");
  }

  const nextUrl = `${url.pathname}${url.search}${options.removeHash ? "" : url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}

export async function resolveEmailLinkSession(
  supabase: SupabaseClient
): Promise<EmailLinkSessionResult> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    cleanUrl({ removeCode: true });

    if (error) {
      return { user: null, error: "This invitation link is invalid or has expired. Request a new invitation." };
    }
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    cleanUrl({ removeHash: true });

    if (error) {
      return { user: null, error: "This invitation session could not be verified. Request a new invitation." };
    }
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null };
  }

  return { user: data.user };
}
