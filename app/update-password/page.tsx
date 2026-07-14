"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import { InputField } from "../components/InputField";
import { PrimaryButton } from "../components/PrimaryButton";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { isPasswordValid } from "@/lib/password-requirements";

export default function UpdatePasswordPage() {
 const [mode, setMode] = useState<"loading" | "reset" | "update" | "missing">("loading");
 const [newPassword, setNewPassword] = useState("");

 const [currentPassword, setCurrentPassword] = useState("");

 const [confirmPassword, setConfirmPassword] = useState("");

 const [loading, setLoading] = useState(false);

 const router = useRouter();

 useEffect(() => {
 const recoveryLink =
 window.location.search.includes("code=") ||
 window.location.hash.includes("type=recovery");

 const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
 if (event === "PASSWORD_RECOVERY") {
 setMode("reset");
 } else if (event === "INITIAL_SESSION") {
 setMode(session ? (recoveryLink ? "reset" : "update") : "missing");
 }
 });

 return () => listener.subscription.unsubscribe();
 }, []);

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();

 // Stop multiple clicks
 setLoading(true);

 if (mode === "missing") {
 toast.error("Your password reset link is missing or has expired. Request a new link.");
 setLoading(false);
 return;
 }

 if (mode === "update" && !currentPassword) {
 toast.error("Current password is missing. Enter your current password to continue.");
 setLoading(false);
 return;
 }

 if (!isPasswordValid(newPassword)) {
 toast.error("Password does not meet all requirements.");
 setLoading(false);
 return;
 }

 // Check both passwords match
 if (newPassword !== confirmPassword) {
 toast.error("Passwords do not match.");
 setLoading(false);
 return;
 }

 if (mode === "update") {
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user?.email) {
 toast.error("We could not verify your account. Please sign in again.");
 setLoading(false);
 return;
 }

 const { error: verificationError } = await supabase.auth.signInWithPassword({
 email: user.email,
 password: currentPassword,
 });

 if (verificationError) {
 toast.error("Your current password is incorrect. Please try again.");
 setLoading(false);
 return;
 }
 }

 // Update the user's password in Supabase Authentication
 const { error } = await supabase.auth.updateUser({
 password: newPassword,
 });

 if (error) {
 toast.error(
 error.message.toLowerCase().includes("session")
 ? "Your password reset session has expired. Request a new reset link."
 : error.message
 );
 setLoading(false);
 return;
 }

 // Get the currently logged-in user
 const {
 data: { user },
 } = await supabase.auth.getUser();

 // Get the user's role from the profiles table
 const { data: profile } = await supabase
 .from("profiles")
 .select("role")
 .eq("id", user?.id)
 .single();

 // Privileged profile flags are changed only by an authenticated server route.
 const finalizeResponse = await fetch("/api/profile/password-changed", { method: "POST" });
 const finalizeResult = await finalizeResponse.json();
 if (!finalizeResponse.ok) {
 toast.error(finalizeResult.error);
 setLoading(false);
 return;
 }

 if (finalizeResult.shouldSignIn) {
 toast.success("Account created. Sign in to open your dashboard.");
 await supabase.auth.signOut();
 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 setLoading(false);
 setTimeout(() => router.push("/"), 1500);
 return;
 }

 toast.success(mode === "reset" ? "Password reset successfully." : "Password updated successfully.");

 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 setLoading(false);

 setTimeout(() => {
 switch (profile?.role) {
 case "resident":
 router.push("/residents");
 break;

 case "security":
 router.push("/security");
 break;

 case "admin":
 router.push(finalizeResult.dashboardHref ?? "/admin");
 break;

 case "super_admin":
 router.push(finalizeResult.dashboardHref ?? "/admin/super-admin");
 break;

 default:
 router.push("/");
 }
 }, 1500);
 }

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
 {mode === "reset" ? "Reset Password" : "Update Password"}
 </h1>
 </div>
 </div>

 <form className="space-y-5" onSubmit={handleSubmit}>
 {mode === "missing" ? (
 <div className="space-y-4 text-center">
 <p className="text-sm text-muted-foreground">
 Your password reset link is missing or has expired. Return to sign in and request a new link.
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
 label="New password"
 type="password"
 value={newPassword}
 onChange={(event) => setNewPassword(event.target.value)}
 placeholder="Enter new password"
 autoComplete="new-password"
 />

 <PasswordRequirements password={newPassword} />

 <InputField
 id="confirm-password"
 label="Confirm new password"
 type="password"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 placeholder="Enter new password again"
 autoComplete="new-password"
 />
 <PrimaryButton type="submit" disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}>
 {loading ? (mode === "reset" ? "Resetting..." : "Updating...") : (mode === "reset" ? "Reset Password" : "Update Password")}
 </PrimaryButton>
 </>
 )}
 </form>
 </div>
 </main>
 );
}
