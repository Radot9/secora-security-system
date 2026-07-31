"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, LockKeyhole, ScanLine, UsersRound } from "lucide-react";

import { InputField } from "./components/InputField";
import { resolveEmailLinkSession } from "@/lib/auth/email-link-session";
import { supabase } from "@/lib/supabase";
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
 const [loginLoading, setLoginLoading] = useState(false);
 const [resetLoading, setResetLoading] = useState(false);

 const router = useRouter();

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

 await routeAuthenticatedUser(user.id, "email-link");
 if (mounted) setCheckingEmailLink(false);
 });

 return () => {
 mounted = false;
 };
 // routeAuthenticatedUser is intentionally local to avoid reprocessing one-time URL tokens.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 function redirectForProfile(profile: LoginProfile, source: "email-link" | "password") {
 if (!profile.is_active) {
 toast.error("Your account is inactive. Contact a Super Admin for assistance.");
 return;
 }

 if (profile.must_change_password) {
 if (source === "email-link" && (profile.role === "admin" || profile.role === "super_admin") && !profile.onboarding_completed_at) {
 router.push("/administrator-onboarding");
 return;
 }

 router.push("/update-password");
 return;
 }

 if (profile.role === "resident") {
 router.push("/residents");
 return;
 }

 if (profile.role === "security") {
 router.push("/security");
 return;
 }

 if (profile.role === "admin") {
 router.push("/admin");
 return;
 }

 if (profile.role === "super_admin") {
 router.push("/admin/super-admin");
 }
 }

 async function routeAuthenticatedUser(userId: string, source: "email-link" | "password") {
 const { data: profile, error: profileError } = await supabase
 .from("profiles")
 .select("role, must_change_password, is_active, onboarding_completed_at")
 .eq("id", userId)
 .single();

 if (profileError || !profile) {
 toast.error("Profile not found.");
 return;
 }

 if (!profile.is_active) {
 await supabase.auth.signOut();
 }

 redirectForProfile(profile, source);
 }

 async function handlePasswordReset() {
 if (!email) {
 toast.error("Enter your email address first.");
 return;
 }

 setResetLoading(true);
 const { error } = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: `${window.location.origin}/update-password`,
 });

 if (error) {
 setResetLoading(false);
 toast.error(error.message);
 return;
 }

 setResetLoading(false);
 toast.success("Check your email for the password change link.");
 }

 async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 if (loginLoading) return;
 setLoginLoading(true);

 const { data, error } = await supabase.auth.signInWithPassword({
 email,
 password,
 });

 if (error) {
 setLoginLoading(false);
 toast.error(error.message);
 return;
 }

 await routeAuthenticatedUser(data.user.id, "password");
 setLoginLoading(false);
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

 return (
 <main className="login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
 <div className="login-orb login-orb--one" aria-hidden="true" />
 <div className="login-orb login-orb--two" aria-hidden="true" />

 <div className="relative grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] xl:gap-20">
 <section className="hidden flex-col justify-center lg:flex">
 <div className="flex items-center gap-3">
 <BrandMark />
 <div>
 <p className="text-lg font-bold tracking-[-0.025em]">Secora</p>
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
 <p className="font-bold tracking-[-0.02em]">Secora</p>
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
 disabled={loginLoading}
 className="apple-primary-button flex min-h-13 w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
 >
 <span className="inline-flex items-center justify-center gap-2">
 {loginLoading && <LoadingSpinner />}
 {loginLoading ? "Signing in..." : "Sign In"}
 {!loginLoading && <ArrowRight className="h-4 w-4" />}
 </span>
 </button>
 </form>
 <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">
 Access is restricted to authorized Secora accounts.
 </p>
 </section>
 </div>
 </main>
 );
}
