"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import SettingsSection from "./SettingsSection";
import { InputField } from "../InputField";
import { PasswordRequirements } from "../PasswordRequirements";
import { isPasswordValid } from "@/lib/password-requirements";

export default function ChangePasswordCard() {
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");

 const [loading, setLoading] = useState(false);

 async function handleChangePassword(
 e: React.FormEvent
 ) {
 e.preventDefault();

 if (!currentPassword) {
 toast.error("Current password is missing. Enter your current password to continue.");
 return;
 }

 if (newPassword !== confirmPassword) {
 toast.error("Passwords do not match.");
 return;
 }

 if (!isPasswordValid(newPassword)) {
 toast.error("Password does not meet all requirements.");
 return;
 }

 setLoading(true);

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

 const { error } = await supabase.auth.updateUser({
 password: newPassword,
 });

 setLoading(false);

 if (error) {
 toast.error(error.message);
 return;
 }

 toast.success("Password updated successfully.");

 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 }

 return (
 <SettingsSection title="Security & Password">
 <form
 onSubmit={handleChangePassword}
 className="space-y-5"
 >
 <InputField
 id="settings-current-password"
 label="Current Password"
 type="password"
 value={currentPassword}
 onChange={(e) => setCurrentPassword(e.target.value)}
 autoComplete="current-password"
 />

 <InputField
 id="settings-new-password"
 label="New Password"
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 autoComplete="new-password"
 />

 <PasswordRequirements password={newPassword} />

 <InputField
 id="settings-confirm-password"
 label="Confirm Password"
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 autoComplete="new-password"
 />

 <button
 type="submit"
 disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
 className="inline-flex items-center gap-2 rounded-2xl bg-primary/100 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary disabled:opacity-50"
 >
 <Lock className="h-5 w-5" />

 {loading
 ? "Updating..."
 : "Update Password"}
 </button>
 </form>
 </SettingsSection>
 );
}
