import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import visitors from "../../data/visitors.json";

export default function VisitorsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Manage guest access for your home
            </p>
          </div>
          <Link
            href="/residents/generate-code"
            aria-label="Add new visitor"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-sm transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[390px] border-collapse text-left text-sm">
              <thead className="bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Phone number</th>
                  <th className="px-3 py-3 font-medium">Time in</th>
                  <th className="px-4 py-3 font-medium">Time out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {visitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-700 dark:text-slate-200">
                      {visitor.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-slate-700 dark:text-slate-200">
                      {visitor.phoneNumber}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-slate-700 dark:text-slate-200">
                      {visitor.timeIn}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-700 dark:text-slate-200">
                      {visitor.timeOut}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <ResidentBottomNav />
    </main>
  );
}
