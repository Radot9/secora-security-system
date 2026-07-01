"use client";


import { ResidentBottomNav } from "../components/ResidentBottomNav";
import { AppShell } from "../components/ui/AppShell";
import { Card } from "../components/ui/Card";
import { PageSection } from "../components/ui/PageSection";

import { CardSection } from "../components/ui/CardSection";
import { UserPlus, QrCode } from "lucide-react";
import { ActionCard } from "../components/ui/ActionCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Visitor } from "@/types/visitors";

const quickActions = [
  {
    title: "Add Visitor",
    href: "/residents/generate-code",
    description: "Create and share a visitor access code",
    icon: <UserPlus className="h-6 w-6" />,
  },
  {
    title: "Access Codes",
    href: "/residents/access-code",
    description: "View the latest generated visitor pass",
    icon: <QrCode className="h-6 w-6" />,
  },
];

export default function ResidentsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  async function loadVisitors() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

   

    const { data: residentData, error: residentError } = await supabase
      .from("residents")
      .select("id, full_name, house_number, street")
      .eq("user_id", user.id)
      .single();

    if (residentError || !residentData) return;

    // Save resident information for the dashboard
    setResident(residentData);

    if (!resident) return;

    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .eq("resident_id", residentData.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setVisitors(data);
    }
  }

  // Logged-in resident information
  const [resident, setResident] = useState<{
    
    full_name: string;
    house_number: string;
    street: string;
  } | null>(null);

  useEffect(() => {
    loadVisitors();
  }, []);

  return (
    <AppShell size="default">
      <div className="flex flex-col gap-8">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-bold text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
            {resident?.full_name
              ?.split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "R"}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Welcome {resident?.full_name ?? "Resident"}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
              {resident
                ? `${resident.house_number}, ${resident.street}, Thomas Ajufo Estate`
                : "Thomas Ajufo Estate"}
            </p>
          </div>
        </header>

        <Card className="border-0 bg-teal-50 dark:bg-teal-950/20">
          <PageSection spacing="md">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Resident Portal
            </p>

            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Manage your estate visitors
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Add expected visitors, share access codes, and keep track of who
                has checked in or out.
              </p>
            </div>
          </PageSection>
        </Card>

        {/* Quick Actions */}

        <section className="grid gap-4 lg:grid-cols-2">
          {quickActions.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              href={action.href}
              icon={action.icon}
            />
          ))}
        </section>

        <CardSection
          title="Recent Visitors"
          actionLabel="View all"
          actionHref="/residents/visitors"
        >
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visitors.slice(0, 3).map((visitor) => (
              <article
                key={visitor.id}
                className="flex items-start justify-between px-8 py-5"
              >
                <div>
                  <h3 className="font-semibold">{visitor.visitor_name}</h3>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {visitor.visitor_phone}
                  </p>
                </div>

                <time className="text-sm text-slate-600 dark:text-slate-300">
                  {visitor.entry_time
                    ? new Date(visitor.entry_time).toLocaleTimeString()
                    : "Pending"}
                </time>
              </article>
            ))}
          </div>
        </CardSection>
      </div>
      <ResidentBottomNav />
    </AppShell>
  );
}
