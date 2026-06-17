'use client'

import { useState } from "react";
import { InputField } from "../components/InputField";
import { PrimaryButton } from "../components/PrimaryButton";

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

        <form className="space-y-5">
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
            label="Enter new password again"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
          />

          <PrimaryButton type="submit">Update Password</PrimaryButton>
        </form>
      </div>
    </main>
  );
}
