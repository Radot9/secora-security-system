"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import { InputField } from "../components/InputField";
import { PrimaryButton } from "../components/PrimaryButton";

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Stop multiple clicks
    setLoading(true);

    // Check both passwords match
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Update the user's password in Supabase Authentication
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message);
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

    // Mark that the user has changed their temporary password
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        must_change_password: false,
      })
      .eq("id", user?.id);

    if (profileError) {
      console.error(profileError);
      toast.error(profileError.message);
      setLoading(false);
      return;
    }

    toast.success("Password updated successfully.");

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
          router.push("/admin");
          break;

        default:
          router.push("/");
      }
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 sm:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-100 text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
            <span className="text-3xl font-black">S</span>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-500">
              Security
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Update Password
            </h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <InputField
            id="current-password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
          />

          <InputField
            id="new-password"
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
          />

          <InputField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter new password again"
            autoComplete="new-password"
          />
          <p className="text-sm text-slate-500">
            Password must be at least 8 characters and include an uppercase
            letter, a number and a special character.
          </p>

          <PrimaryButton type="submit">Update Password</PrimaryButton>
        </form>
      </div>
    </main>
  );
}
