import Link from "next/link";
import { ResidentBottomNav } from "../components/ResidentBottomNav";
import visitors from "../data/visitors.json";

const quickActions = [
  {
    label: "Add visitor",
    href: "/residents/generate-code",
    description: "Create and share a visitor access code",
  },
  {
    label: "Access codes",
    href: "/residents/access-code",
    description: "View the latest generated visitor pass",
  },
];

export default function ResidentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-5xl flex-col gap-8">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-bold text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
            MM
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Welcome Michael
            </h1>
            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
              2, Ofili close, Thomas Ajufo Estate
            </p>
          </div>
        </header>

        <section className="rounded-[2rem] bg-teal-50 p-6 dark:bg-teal-950/20">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            Resident portal
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            Manage your estate visitors
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add expected visitors, share access codes, and keep track of who has
            checked in or out.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-teal-300 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 dark:hover:bg-teal-950/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{action.label}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {action.description}
                  </p>
                </div>
                <span className="text-2xl text-teal-500" aria-hidden="true">
                  +
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
          <div className="flex items-center justify-between px-4 py-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent visitors
            </h2>
            <Link
              href="/residents/visitors"
              className="text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visitors.slice(0, 3).map((visitor) => (
              <article key={visitor.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{visitor.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {visitor.phoneNumber}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {visitor.timeIn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <ResidentBottomNav />
    </main>
  );
}
