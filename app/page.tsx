'use client'

import Link from "next/link";
import { useState } from "react";
import { InputField } from "./components/InputField";
import { PrimaryButton } from "./components/PrimaryButton";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 sm:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-100 text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
            <span className="text-3xl font-black">S</span>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-500">Security</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sign in to your account</h1>
          </div>
        </div>

        <form className="space-y-5">
          <InputField
            id="username"
            label="User name"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your user name"
            autoComplete="username"
          />

          <InputField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
              />
              Keep me signed in
            </label>
            <Link href="/update-password" className="text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200">
              Forgot password?
            </Link>
          </div>

          <PrimaryButton type="submit">Sign in</PrimaryButton>
        </form>
      </div>
    </main>
  );
}
