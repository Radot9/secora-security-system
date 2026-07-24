"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InputField } from "./components/InputField";
import { resolveEmailLinkSession } from "@/lib/auth/email-link-session";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

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
 <main className="flex min-h-screen items-center justify-center bg-background px-4 text-muted-foreground">
 Signing you in...
 </main>
 );
 }

 return (
 <main className="flex min-h-screen items-center justify-center bg-background px-4">
 <div className="w-full max-w-md">
 <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
 <div className="text-center">
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
 S
 </div>

 <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
 Secora
 </h1>

 <p className="mt-2 text-sm leading-6 text-muted-foreground">
 Secure access for residents, security personnel and estate
 administrators.
 </p>
 </div>
 <form className="mt-8 space-y-6" onSubmit={handleLogin}>
 <div>
 <label
 htmlFor="email"
 className="mb-2 block text-sm font-medium text-foreground"
 >
 Email Address
 </label>

 <input
 id="email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="Enter your email"
 className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
 />
 </div>

 <InputField
 id="password"
 label="Password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Enter your password"
 autoComplete="current-password"
 />

 <div className="text-right">
 <button
 type="button"
 onClick={handlePasswordReset}
 disabled={resetLoading || loginLoading}
 className="text-sm font-medium text-primary transition hover:underline"
 >
 {resetLoading ? "Sending link..." : "Forgot or change password?"}
 </button>
 </div>

 <button
 type="submit"
 disabled={loginLoading}
 className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <span className="inline-flex items-center justify-center gap-2">
 {loginLoading && <LoadingSpinner />}
 {loginLoading ? "Signing in..." : "Sign In"}
 </span>
 </button>
 </form>
 </div>
 </div>
 </main>
 );
}
