"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";


const quickActions = [
  {
    label: "Currently Inside",
    href: "/admin/currently-inside",
    description: "View visitors currently inside the estate",
  },
  {
    label: "Visitor History",
    href: "/admin/visitor-history",
    description: "Review all visitor records and movements",
  },
  {
    label: "Residents",
    href: "/admin/residents",
    description: "Manage residents and homes",
  },
  {
    label: "Access Logs",
    href: "/admin/access-logs",
    description: "Review visitor verification activity",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    description: "Monitor estate visitor trends",
  },
  {
    label: "Estate Settings",
    href: "/admin/settings",
    description: "Configure estate access rules",
  },
];

export default function AdminPage() {
  const [metrics, setMetrics] = useState([
    {
      label: "Visitors Today",
      value: "0",
    },
    {
      label: "Currently Inside",
      value: "0",
    },
    {
      label: "Checked Out",
      value: "0",
    },
    {
      label: "Revoked Passes",
      value: "0",
    },
  ]);

  useEffect(() => {
    async function loadMetrics() {
      const { count: visitorsToday } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true });

      const { count: currentlyInside } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("status", "entered");

      const { count: checkedOut } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("status", "exited");

      const { count: revoked } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("status", "revoked");

      setMetrics([
        {
          label: "Visitors Today",
          value: String(visitorsToday ?? 0),
        },
        {
          label: "Currently Inside",
          value: String(currentlyInside ?? 0),
        },
        {
          label: "Checked Out",
          value: String(checkedOut ?? 0),
        },
        {
          label: "Revoked Passes",
          value: String(revoked ?? 0),
        },
      ]);
    }

    loadMetrics();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-col gap-8">
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

        <section className="grid gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-teal-300 hover:bg-teal-50 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{action.label}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {action.description}
                  </p>
                </div>

                <span className="text-2xl text-teal-500">→</span>
              </div>
            </Link>
          ))}
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
