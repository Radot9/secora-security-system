"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import SettingsSection from "./SettingsSection";

export default function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleChangePassword(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error(
        "Password must be at least 8 characters."
      );
      return;
    }

    setLoading(true);

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
        <div>
          <label className="mb-2 block text-sm font-medium">
            Current Password
          </label>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            New Password
          </label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
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