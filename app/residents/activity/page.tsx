import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import visitors from "../../data/visitors.json";

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-4xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Recent visitor movements for your residence
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visitors.map((visitor, index) => (
              <article key={visitor.id} className="flex items-center gap-4 px-5 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-500">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{visitor.name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {index % 2 === 0 ? "Checked in" : "Checked out"} at{" "}
                    {index % 2 === 0 ? visitor.timeIn : visitor.timeOut}
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
