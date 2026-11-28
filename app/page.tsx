"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LockKeyhole, Mail, ScanLine, UsersRound } from "lucide-react";

import { InputField } from "./components/InputField";
import { resolveEmailLinkSession } from "@/lib/auth/email-link-session";
import { setStaySignedIn, supabase } from "@/lib/supabase";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { BrandMark } from "./components/ui/BrandMark";

type LoginProfile = {
 role: string;
 must_change_password: boolean;
 is_active: boolean;
 onboarding_completed_at: string | null;
};

function hasEmailLinkTokens() {
 if (typeof window === "undefined") return false;
 return (
 window.location.search.includes("code=") ||
 window.location.hash.includes("access_token=") ||
 window.location.hash.includes("refresh_token=")
 );
}

export default function Home() {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [checkingEmailLink, setCheckingEmailLink] = useState(hasEmailLinkTokens);
 const [passkeyLoading, setPasskeyLoading] = useState(false);
 const [staySignedIn, setStaySignedInChoice] = useState(false);
 const [loginLoading, setLoginLoading] = useState(false);
 const [resetLoading, setResetLoading] = useState(false);
 const [resetSentForEmail, setResetSentForEmail] = useState<string | null>(null);

 useEffect(() => {
 if (!hasEmailLinkTokens()) return;
 let mounted = true;

 resolveEmailLinkSession(supabase).then(async ({ user, error }) => {
 if (!mounted) return;
 if (!user) {
 toast.error(error ?? "This sign-in link is invalid or has expired. Request a new link.");
 setCheckingEmailLink(false);
 return;
 }

 const navigationStarted = await routeAuthenticatedUser(user.id, "email-link");
 if (mounted && !navigationStarted) setCheckingEmailLink(false);
 });

 return () => {
 mounted = false;
 };
 // routeAuthenticatedUser is intentionally local to avoid reprocessing one-time URL tokens.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 function dashboardForProfile(profile: LoginProfile, source: "email-link" | "password") {
 if (!profile.is_active) {
 toast.error("Your account is inactive. Contact a Super Admin for assistance.");
 return null;
 }

 if (profile.must_change_password) {
 if (source === "email-link" && (profile.role === "admin" || profile.role === "super_admin") && !profile.onboarding_completed_at) {
 return "/administrator-onboarding";
 }

 return "/update-password";
 }

 if (profile.role === "resident") {
 return "/residents";
 }

 if (profile.role === "security") {
 return "/security";
 }

 if (profile.role === "admin") {
 return "/admin";
 }

 if (profile.role === "super_admin") {
 return "/admin/super-admin";
 }

 toast.error("Your account does not have a recognized dashboard role.");
 return null;
 }

 async function routeAuthenticatedUser(userId: string, source: "email-link" | "password") {
 const { data: profile, error: profileError } = await supabase
 .from("profiles")
 .select("role, must_change_password, is_active, onboarding_completed_at")
 .eq("id", userId)
 .single();

 if (profileError || !profile) {
 toast.error("Profile not found.");
 return false;
 }

 if (!profile.is_active) {
 await supabase.auth.signOut();
 }

 const destination = dashboardForProfile(profile, source);
 if (!destination) return false;

 // Use a document navigation after sign-in so the protected server route receives
 // the newly written Supabase auth cookie instead of reusing a prefetched guest response.
 window.location.replace(destination);
 return true;
 }

 async function handlePasswordReset() {
 if (!email) {
 toast.error("Enter your email address first.");
 return;
 }

 setResetLoading(true);
 const resetOrigin = new URL(window.location.origin);
 const isLocalOrigin = ["localhost", "127.0.0.1", "[::1]"].includes(resetOrigin.hostname.toLowerCase());
 if (!isLocalOrigin) resetOrigin.protocol = "https:";
 const resetRedirect = new URL("/update-password", resetOrigin);
 resetRedirect.searchParams.set("mode", "recovery");
 const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
 redirectTo: resetRedirect.toString(),
 });

 if (error) {
 setResetLoading(false);
  const message = error.message.toLowerCase();
  if (message.includes("email rate limit exceeded")) {
   toast.error("Password reset emails have reached the sending limit. Try again later or contact your administrator.");
  } else if (message.includes("only request this after")) {
   toast.error("Please wait at least a minute before requesting another password link.");
  } else {
   toast.error(error.message);
  }
 return;
 }

 setResetLoading(false);
 setResetSentForEmail(email.trim());
 }

 async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 if (loginLoading || passkeyLoading) return;
 setLoginLoading(true);
 setStaySignedIn(staySignedIn);

 const { data, error } = await supabase.auth.signInWithPassword({
 email,
 password,
 });

 if (error) {
 setLoginLoading(false);
 toast.error(error.message);
 return;
 }

 const navigationStarted = await routeAuthenticatedUser(data.user.id, "password");
 if (!navigationStarted) setLoginLoading(false);
 }

 async function handlePasskeyLogin() {
  if (loginLoading || passkeyLoading) return;
  setPasskeyLoading(true);
  try {
   if (!window.isSecureContext || !window.PublicKeyCredential) throw new Error("Passkeys are unavailable in this browser. Sign in with your email and password.");
   setStaySignedIn(staySignedIn);
   const { data, error } = await supabase.auth.signInWithPasskey();
   if (error || !data?.user) throw new Error("Passkey sign-in was not completed. Try again or use your email and password.");
   await routeAuthenticatedUser(data.user.id, "password");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Unable to sign in with a passkey.");
  } finally { setPasskeyLoading(false); }
 }

 if (checkingEmailLink) {
 return (
 <main className="login-shell flex min-h-screen items-center justify-center px-4 text-muted-foreground">
 <div className="apple-card flex items-center gap-3 rounded-3xl border border-border bg-card px-6 py-5">
 <LoadingSpinner className="h-5 w-5" />
 <span className="font-medium">Signing you in securely…</span>
 </div>
 </main>
 );
 }

 if (resetSentForEmail) {
  return (
   <main className="login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
    <div className="login-orb login-orb--one" aria-hidden="true" />
    <div className="login-orb login-orb--two" aria-hidden="true" />
    <section className="apple-card login-panel relative w-full max-w-lg rounded-[2rem] border border-border bg-card p-7 text-center sm:p-10">
     <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Mail className="h-8 w-8" /></div>
     <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Password reset</p>
     <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-foreground">Check your email</h1>
     <p className="mt-4 leading-7 text-muted-foreground">
      If an Entriseq account uses <span className="font-semibold text-foreground">{resetSentForEmail}</span>, a password change link is on its way. Check that inbox and its spam or junk folder.
     </p>
     <p className="mt-3 text-sm leading-6 text-muted-foreground">Open the newest link to choose a new password.</p>
     <button type="button" onClick={() => setResetSentForEmail(null)} className="apple-primary-button mt-8 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground">
      Return to sign in
     </button>
    </section>
   </main>
  );
 }

 return (
 <main className="login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
 <div className="login-orb login-orb--one" aria-hidden="true" />
 <div className="login-orb login-orb--two" aria-hidden="true" />

 <div className="relative grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] xl:gap-20">
 <section className="hidden flex-col justify-center lg:flex">
 <div className="flex items-center gap-3">
 <BrandMark />
 <div>
 <p className="text-lg font-bold tracking-[-0.025em]">Entriseq</p>
 <p className="text-xs font-medium text-muted-foreground">Estate security system</p>
 </div>
 </div>

 <p className="mt-12 w-fit rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
 Calm, confident access
 </p>
 <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[1.02] tracking-[-0.045em] text-foreground xl:text-6xl">
 Security that feels effortless.
 </h1>
 <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
 One clear place for residents, gate officers, and administrators to manage every arrival with confidence.
 </p>

 <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
 {[
 { label: "Protected accounts", icon: LockKeyhole },
 { label: "Fast pass checks", icon: ScanLine },
 { label: "Clear role access", icon: UsersRound },
 ].map((item) => {
 const Icon = item.icon;
 return (
 <div key={item.label} className="login-feature">
 <Icon className="h-5 w-5 text-primary" />
 <span>{item.label}</span>
 </div>
 );
 })}
 </div>

 </section>

 <section className="apple-card login-panel w-full rounded-[2rem] border border-border bg-card p-6 sm:p-9">
 <div className="flex items-center gap-3 lg:hidden">
 <BrandMark size="small" />
 <div>
 <p className="font-bold tracking-[-0.02em]">Entriseq</p>
 <p className="text-xs text-muted-foreground">Estate security system</p>
 </div>
 </div>

 <div className="mt-8 lg:mt-0">
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
 Secure sign in
 </p>
 <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-foreground">
 Welcome back
 </h2>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">
 Enter your account details to continue to your portal.
 </p>
 </div>

 <form className="mt-8 space-y-6" onSubmit={handleLogin}>
 <InputField
 id="email"
 label="Email address"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="Enter your email"
 autoComplete="email"
 />

 <InputField
 id="password"
 label="Password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Enter your password"
 autoComplete="current-password"
 />

 <label className="flex items-center gap-3 text-sm font-medium">
 <input type="checkbox" checked={staySignedIn} onChange={(event) => setStaySignedInChoice(event.target.checked)} className="h-4 w-4 accent-primary" />
 Stay signed in on this device
 </label>
 <div className="flex justify-end">
 <button
 type="button"
 onClick={handlePasswordReset}
 disabled={resetLoading || loginLoading}
 className="rounded-lg px-1 py-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
 >
 {resetLoading ? "Sending link..." : "Forgot or change password?"}
 </button>
 </div>

 <button
 type="submit"
 disabled={loginLoading || passkeyLoading}
 className="apple-primary-button flex min-h-13 w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
 >
 <span className="inline-flex items-center justify-center gap-2">
 {loginLoading && <LoadingSpinner />}
 {loginLoading ? "Signing in..." : "Sign In"}
 {!loginLoading && <ArrowRight className="h-4 w-4" />}
 </span>
 </button>
 </form>
 <button type="button" onClick={() => void handlePasskeyLogin()} disabled={loginLoading || passkeyLoading} className="mt-4 w-full rounded-2xl border border-border px-4 py-3 font-semibold disabled:opacity-50">{passkeyLoading ? "Waiting for your device…" : "Sign in with a passkey"}</button>
 <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">
 Access is restricted to authorized Entriseq accounts.
 </p>
 </section>
 </div>
 </main>
 );
}
