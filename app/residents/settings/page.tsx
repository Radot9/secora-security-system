import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";

const settings = [
  "Profile information",
  "Residence details",
  "Notification preferences",
  "Security and password",
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Manage your account and resident preferences
          </p>
        </header>

        <section className="rounded-[2rem] bg-teal-50 p-6 dark:bg-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-bold text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
              MM
            </div>
            <div>
              <h2 className="font-bold">Michael Jackson</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                2, Ofili close, Thomas Ajufo Estate
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {settings.map((item) => (
              <button
                key={item}
                type="button"
                className="flex w-full items-center justify-between px-5 py-5 text-left font-medium transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400 dark:hover:bg-teal-950/20"
              >
                {item}
                <span className="text-slate-400" aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
          </div>
        </section>

        <Link
          href="/update-password"
          className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Update password
        </Link>
      </div>
      <ResidentBottomNav />
    </main>
  );
}
