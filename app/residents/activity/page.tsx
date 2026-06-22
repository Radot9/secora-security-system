import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import visitors from "../../data/visitors.json";
import { AppShell } from "../../components/ui/AppShell";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";

export default function ActivityPage() {
  return (
    <AppShell maxWidth="lg">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Activity Logs"
          subtitle="Recent visitor movements for your residence"
        />

        <Card>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visitors.map((visitor, index) => (
              <article
                key={visitor.id}
                className="flex items-center gap-4 px-5 py-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-500">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
        </Card>
      </div>
      <ResidentBottomNav />
    </AppShell>
  );
}
