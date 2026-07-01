import { ActivityItem } from "@/types/activity";

interface ActivityTableProps {
  activity: ActivityItem[];
  setSelectedVisitor: (visitor: ActivityItem) => void;
  getVisitorStatus: (visitor: ActivityItem) => string;
}

type ActivityItem = {
    id: string;
    visitor_name: string;
    visitor_phone?: string;
    plate_number?: string;
    resident_name?: string;
    access_code: string;
    status: string;
    created_at: string;
    entry_time?: string;
    exit_time?: string;
    expires_at?: string;
  };

export default function ActivityTable({
  activity,
  setSelectedVisitor,
  getVisitorStatus,
}: ActivityTableProps) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          Recent Verification
        </h2>

        <button
          type="button"
          className="text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200"
        >
          View all
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
        {activity.map((item) => {
          const displayStatus = getVisitorStatus(item);

          const isDenied =
            displayStatus === "expired" || displayStatus === "revoked";

          return (
            <article
              key={item.id}
              onClick={() => setSelectedVisitor(item)}
              className="cursor-pointer flex items-center gap-4 border-b border-slate-200 px-5 py-5 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  isDenied
                    ? "bg-red-50 text-red-500"
                    : "bg-teal-50 text-teal-500"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {isDenied ? (
                    <path d="m6 6 12 12M18 6 6 18" />
                  ) : (
                    <path d="m5 13 4 4L19 7" />
                  )}
                </svg>
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{item.visitor_name}</h3>

                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                  Code: {item.access_code} •{" "}
                  <span
                    className={
                      displayStatus === "entered"
                        ? "text-green-600 font-semibold"
                        : displayStatus === "pending"
                        ? "text-blue-600 font-semibold"
                        : displayStatus === "expired"
                        ? "text-amber-600 font-semibold"
                        : displayStatus === "revoked"
                        ? "text-red-600 font-semibold"
                        : "text-slate-600 font-semibold"
                    }
                  >
                    {displayStatus}
                  </span>
                </p>
              </div>

              <time className="text-sm text-slate-600 dark:text-slate-300">
                {new Date(item.created_at).toLocaleTimeString()}
              </time>
            </article>
          );
        })}
      </div>
    </section>
  );
}