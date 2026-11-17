"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setStaySignedIn, supabase } from "@/lib/supabase";

import PasskeySetupCard from "../components/profile/PasskeySetupCard";
import { InputField } from "../components/InputField";
import { PrimaryButton } from "../components/PrimaryButton";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { isPasswordValid, passwordRequirementsMessage } from "@/lib/password-requirements";

export default function UpdatePasswordPage() {
 const [mode, setMode] = useState<"loading" | "setup" | "reset" | "update" | "missing">("loading");
 const [newPassword, setNewPassword] = useState("");

 const [currentPassword, setCurrentPassword] = useState("");

 const [confirmPassword, setConfirmPassword] = useState("");

 const [loading, setLoading] = useState(false);
 const [formError, setFormError] = useState<string | null>(null);
 const [progress, setProgress] = useState("Creating password…");
 const submitting = useRef(false);

 const router = useRouter();
 const [staySignedIn, setStaySignedInChoice] = useState(false);
 const activationToken = useRef<string | null>(null);
 const verifiedToken = useRef(false);
 const [dashboardHref, setDashboardHref] = useState<string | null>(null);

 useEffect(() => {
 const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
 const queryParams = new URLSearchParams(window.location.search);
 const linkType = hashParams.get("type") || queryParams.get("type");
 const isActivation = window.location.pathname === "/activate";
 activationToken.current = isActivation && queryParams.get("type") === "recovery" ? queryParams.get("token_hash") : null;
 const setupLink = isActivation || queryParams.has("code") || queryParams.get("mode") === "setup" || linkType === "invite" || linkType === "signup";
 const recoveryLink = linkType === "recovery";
 const invalidLink = Boolean(
 hashParams.get("error") || hashParams.get("error_code") || queryParams.get("error") || queryParams.get("error_code")
 );

 let active = true;
 const resolveMode = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
 if (!active) return;
 if (invalidLink) { setMode("missing"); return; }
 if (isActivation) { setMode(activationToken.current ? "setup" : "missing"); return; }
 if (!session) { setMode("missing"); return; }

 const response = await fetch("/api/profile/password-changed", { method: "GET", cache: "no-store" });
 if (response.ok) {
 const profileState = await response.json() as { mustChangePassword?: boolean };
 if (active) setMode(setupLink || profileState.mustChangePassword ? "setup" : recoveryLink ? "reset" : "update");
 return;
 }

 const { data } = await supabase.from("profiles").select("must_change_password").eq("id", session.user.id).maybeSingle();
 if (active) setMode(setupLink || data?.must_change_password ? "setup" : recoveryLink ? "reset" : "update");
 };

 const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
 if (invalidLink) setMode("missing");
 else if (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" || event === "SIGNED_IN") window.setTimeout(() => { void resolveMode(session); }, 0);
 });

 void supabase.auth.getSession().then(({ data }) => resolveMode(data.session));

 return () => { active = false; listener.subscription.unsubscribe(); };
 }, []);

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();

 if (submitting.current || mode === "loading") return;
 const formData = new FormData(e.currentTarget);
 const passwordValue = String(formData.get("password") ?? "");
 const confirmationValue = String(formData.get("confirmation") ?? "");
 const currentPasswordValue = String(formData.get("currentPassword") ?? "");
 setFormError(null);
 submitting.current = true;
 setLoading(true);
 try {

 if (mode === "missing") {
 setFormError("Your activation or password link is missing or has expired. Request a fresh link.");
 setLoading(false);
 return;
 }

 if (mode === "update" && !currentPasswordValue) {
 setFormError("Enter your current password to continue.");
 setLoading(false);
 return;
 }

 if (!isPasswordValid(passwordValue) || passwordValue.length > 1024) {
 setFormError(passwordRequirementsMessage);
 setLoading(false);
 return;
 }

 // Check both passwords match
 if (passwordValue !== confirmationValue) {
 setFormError("Passwords do not match. Enter the same password in both fields.");
 setLoading(false);
 return;
 }

 setStaySignedIn(formData.has("staySignedIn"));
 if (activationToken.current && !verifiedToken.current) {
  setProgress("Verifying your activation link…");
  const { error } = await supabase.auth.verifyOtp({ token_hash: activationToken.current, type: "recovery" });
  if (error) {
   setFormError("This activation link is invalid, expired, or already used. Ask your administrator for a fresh link.");
   setLoading(false);
   return;
  }
  verifiedToken.current = true;
 }

 setProgress("Saving your password…");
 const response = await fetch("/api/profile/password-changed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  signal: AbortSignal.timeout(30000),
  body: JSON.stringify({ password: passwordValue, currentPassword: mode === "update" ? currentPasswordValue : undefined }),
 });
 const result = await response.json();
 if (!response.ok) throw new Error(result.error || "Unable to create your password. Please try again.");
 toast.success(mode === "setup" ? "Password created. Opening your dashboard…" : "Password saved. Opening your dashboard…");
 // Document navigation ensures the protected dashboard receives the new session cookies.
 if (mode === "setup" && result.dashboardHref === "/residents") {
  setDashboardHref(result.dashboardHref);
 } else { window.location.replace(result.dashboardHref); }
 } catch (error) {
  setFormError(error instanceof Error && error.name === "TimeoutError" ? "The request timed out. Check your connection and try again." : error instanceof Error ? error.message : "Unable to save your password. Please try again.");
  setLoading(false);
 } finally {
  submitting.current = false;
 }
 }

 if (dashboardHref) return <main className="min-h-screen bg-background px-4 py-10 text-foreground"><div className="mx-auto max-w-md"><p className="mb-5 text-center text-sm text-muted-foreground">Your password is saved and you’re signed in.</p><PasskeySetupCard onContinue={() => window.location.replace(dashboardHref)} /></div></main>;

 return (
 <main className="min-h-screen bg-background px-4 py-10 text-foreground">
 <div className="mx-auto flex w-full max-w-md flex-col gap-10 rounded-3xl border border-border bg-card p-8 shadow-xl shadow-muted/50 sm:p-10">
 <div className="flex flex-col items-center gap-4 text-center">
 <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
 <span className="text-3xl font-black">S</span>
 </div>
 <div>
 <p className="text-sm uppercase tracking-[0.35em] text-primary">
 Security
 </p>
 <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
 {mode === "setup" ? "Create Password" : mode === "reset" ? "Reset Password" : "Update Password"}
 </h1>
 </div>
 </div>

 <form className="space-y-5" onSubmit={handleSubmit}>
 {mode === "missing" ? (
 <div className="space-y-4 text-center">
 <p className="text-sm text-muted-foreground">
 This activation or password link is missing or has expired. Ask a Super Admin for a fresh link.
 </p>
 <PrimaryButton type="button" onClick={() => router.push("/")}>
 Return to Sign In
 </PrimaryButton>
 </div>
 ) : mode === "loading" ? (
 <p className="text-center text-sm text-muted-foreground">Checking your password session...</p>
 ) : (
 <>
 {mode === "update" && (
 <InputField
 id="current-password"
 name="currentPassword"
 label="Current Password"
 type="password"
 value={currentPassword}
 onChange={(event) => setCurrentPassword(event.target.value)}
 placeholder="Enter current password"
 autoComplete="current-password"
 />
 )}

 <InputField
 id="new-password"
 name="password"
 label={mode === "setup" ? "Password" : "New password"}
 type="password"
 value={newPassword}
 onChange={(event) => setNewPassword(event.target.value)}
 placeholder="Enter new password"
 autoComplete="new-password"
 />

 <PasswordRequirements password={newPassword} />

 <InputField
 id="confirm-password"
 name="confirmation"
 label={mode === "setup" ? "Confirm password" : "Confirm new password"}
 type="password"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 placeholder="Enter new password again"
 autoComplete="new-password"
 />
 <label className="flex items-start gap-3 text-sm">
 <input type="checkbox" name="staySignedIn" checked={staySignedIn} onChange={(event) => setStaySignedInChoice(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
 <span><span className="font-semibold">Stay signed in</span><span className="mt-1 block text-muted-foreground">Use this on your personal device. Leave unchecked on a shared device.</span></span>
 </label>
 {formError && <p id="password-form-error" role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p>}
 {loading && <p role="status" className="text-sm text-muted-foreground">{progress}</p>}
 <PrimaryButton type="submit" disabled={loading}>
 {loading ? (mode === "setup" ? "Creating..." : mode === "reset" ? "Resetting..." : "Updating...") : (mode === "setup" ? "Create Password" : mode === "reset" ? "Reset Password" : "Update Password")}
 </PrimaryButton>
 </>
 )}
 </form>
 </div>
 </main>
 );
}
