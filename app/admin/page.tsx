import Link from "next/link";

const metrics = [
  {
    label: "Residents",
    value: "248",
  },
  {
    label: "Security staff",
    value: "16",
  },
  {
    label: "Visitors today",
    value: "42",
  },
  {
    label: "Open alerts",
    value: "3",
  },
];

const managementAreas = [
  {
    title: "Resident records",
    description: "Manage resident accounts, homes, and estate access.",
  },
  {
    title: "Security operations",
    description: "Review officer activity and visitor verification logs.",
  },
  {
    title: "Estate settings",
    description: "Configure addresses, gates, access rules, and notices.",
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-base font-bold text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
            S
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Thomas Ajufo Estate
            </p>
          </div>
        </header>

        <section className="rounded-[2rem] bg-teal-50 p-6 dark:bg-teal-950/20">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            Estate overview
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            Monitor residents, staff, and visitor access
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Use this area to manage account roles, estate records, and access
            activity across all gates.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10"
            >
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {metric.label}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
          <div className="px-5 py-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Management
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {managementAreas.map((area) => (
              <button
                key={area.title}
                type="button"
                className="w-full px-5 py-5 text-left transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400 dark:hover:bg-teal-950/20"
              >
                <h3 className="font-semibold">{area.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {area.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <Link
          href="/security"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          View security activity
        </Link>
      </div>
    </main>
  );
}
