"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { InputField } from "@/app/components/InputField";
import { PasswordRequirements } from "@/app/components/PasswordRequirements";
import { resolveEmailLinkSession } from "@/lib/auth/email-link-session";
import { PrimaryButton } from "@/app/components/PrimaryButton";
import { isPasswordValid } from "@/lib/password-requirements";

type OnboardingStatus = {
 profile?: {
 full_name: string | null;
 phone: string | null;
 role: string;
 must_change_password: boolean;
 onboarding_completed_at: string | null;
 };
 invitation?: {
 profile_completed_at: string | null;
 status: string;
 accepted_at: string | null;
 } | null;
};

export default function AdministratorOnboardingPage() {
 const [checking, setChecking] = useState(true);
 const [step, setStep] = useState<"profile" | "password">("profile");
 const [fullName, setFullName] = useState("");
 const [phone, setPhone] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 useEffect(() => {
 let mounted = true;

 resolveEmailLinkSession(supabase).then(async ({ user, error }) => {
 if (!mounted) return;
 if (!user) {
 toast.error(error ?? "Open the administrator invitation link from your email.");
 router.replace("/");
 return;
 }

 const statusResponse = await fetch("/api/admin/onboarding/profile", { cache: "no-store" });
 const status = await statusResponse.json() as OnboardingStatus & { error?: string };
 if (!mounted) return;

 if (!statusResponse.ok) {
 toast.error(status.error ?? "Unable to load your administrator setup.");
 router.replace("/");
 return;
 }

 if (status.profile?.onboarding_completed_at) {
 toast.success("Your Super Admin account is ready. Signing you in.");
 router.replace(status.profile.role === "super_admin" ? "/admin/super-admin" : "/admin");
 router.refresh();
 return;
 }

 const savedFullName = status.profile?.full_name ?? user.user_metadata.full_name;
 const savedPhone = status.profile?.phone ?? user.user_metadata.phone;
 setFullName(String(savedFullName ?? ""));
 setPhone(String(savedPhone ?? ""));
 if (status.invitation?.profile_completed_at || (savedFullName && savedPhone)) {
 setStep("password");
 }
 setChecking(false);
 });

 return () => {
 mounted = false;
 };
 }, [router]);

 async function saveProfile(event: React.FormEvent) {
 event.preventDefault();
 setLoading(true);
 const response = await fetch("/api/admin/onboarding/profile", {
 method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, phone }),
 });
 const result = await response.json();
 setLoading(false);
 if (!response.ok) return toast.error(result.error);
 setStep("password");
 toast.success("Profile saved. Now create your password.");
 }

 async function completeOnboarding() {
 const response = await fetch("/api/admin/onboarding/complete", { method: "POST" });
 const result = await response.json();
 if (!response.ok) {
 toast.error(result.error);
 return false;
 }

 if (result.shouldSignIn) {
 await supabase.auth.signOut();
 toast.success("Account created. Sign in to open your dashboard.");
 router.replace("/");
 } else {
 toast.success("Administrator account created. Redirecting to your dashboard.");
 router.replace(result.dashboardHref ?? "/admin/super-admin");
 router.refresh();
 }
 return true;
 }

 async function finishOnboarding(event: React.FormEvent) {
 event.preventDefault();
 if (!isPasswordValid(password)) return toast.error("Password does not meet all requirements.");
 if (password !== confirmPassword) return toast.error("Passwords do not match.");
 setLoading(true);
 const { error: passwordError } = await supabase.auth.updateUser({ password });
 if (passwordError) {
 const passwordAlreadySet = passwordError.message.toLowerCase().includes("different from the old password");
 if (!passwordAlreadySet) {
 setLoading(false);
 return toast.error(passwordError.message);
 }
 }
 const completed = await completeOnboarding();
 setLoading(false);
 if (!completed && passwordError) {
 toast.error("Your password is already set. Finish setup after signing in again.");
 }
 }

 if (checking) return <main className="flex min-h-screen items-center justify-center text-muted-foreground">Checking your invitation...</main>;

 return (
 <main className="min-h-screen bg-background px-4 py-10 text-foreground">
 <div className="mx-auto w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-xl">
 <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Entriseq administrator</p>
 <h1 className="mt-3 text-3xl font-bold">{step === "profile" ? "Complete your profile" : "Create your password"}</h1>
 <p className="mt-2 text-sm text-muted-foreground">Step {step === "profile" ? "1" : "2"} of 2</p>

 {step === "profile" ? (
 <form className="mt-8 space-y-5" onSubmit={saveProfile}>
 <InputField id="admin-full-name" label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
 <InputField id="admin-phone" label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
 <PrimaryButton type="submit" disabled={loading}>{loading ? "Saving..." : "Continue"}</PrimaryButton>
 </form>
 ) : (
 <form className="mt-8 space-y-5" onSubmit={finishOnboarding}>
 <InputField id="admin-new-password" label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
 <PasswordRequirements password={password} />
 <InputField id="admin-confirm-password" label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
 <p className="text-sm text-muted-foreground">If you already created this password, enter it again to finish activating your Super Admin dashboard.</p>
 <PrimaryButton type="submit" disabled={loading || !isPasswordValid(password) || password !== confirmPassword}>{loading ? "Finishing..." : "Create account"}</PrimaryButton>
 </form>
 )}
 </div>
 </main>
 );
}
