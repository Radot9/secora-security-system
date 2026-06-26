"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { EmptyState } from "@/app/components/ui/EmptyState";

type Visitor = {
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

export default function VisitorHistoryPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState("");

  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    async function loadVisitors() {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setVisitors(data || []);
    }

    loadVisitors();
  }, []);

  const filteredVisitors = visitors.filter((visitor) => {
    const term = search.toLowerCase();

    return (
      visitor.visitor_name?.toLowerCase().includes(term) ||
      visitor.visitor_phone?.toLowerCase().includes(term) ||
      visitor.access_code?.toLowerCase().includes(term) ||
      visitor.plate_number?.toLowerCase().includes(term)
    );
  });

  function getVisitorStatus(visitor: Visitor) {
    if (
      visitor.status === "pending" &&
      visitor.expires_at &&
      new Date(visitor.expires_at) < new Date()
    ) {
      return "expired";
    }

    return visitor.status;
  }

  return (
    <AppShell size="default">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Visitor History"
          subtitle="View all visitor records across the estate"
        />

        <input
          type="text"
          placeholder="Search visitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
        />

        {filteredVisitors.length === 0 ? (
          <EmptyState
            title="No Visitors Found"
            description="No visitor records match your search."
          />
        ) : (
          <div className="grid gap-4">
            {filteredVisitors.map((visitor) => (
              <Card
                key={visitor.id}
                onClick={() => setSelectedVisitor(visitor)}
                className="cursor-pointer transition hover:border-teal-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {visitor.visitor_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      Code: {visitor.access_code}
                    </p>
                  </div>

                  <StatusBadge status={getVisitorStatus(visitor)} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Entry Time</p>

                    <p className="text-sm">
                      {visitor.entry_time
                        ? new Date(visitor.entry_time).toLocaleString()
                        : "Not Entered"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Exit Time</p>

                    <p className="text-sm">
                      {visitor.exit_time
                        ? new Date(visitor.exit_time).toLocaleString()
                        : "Still Inside"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Visitor History Modal */}

      {selectedVisitor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedVisitor(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold">Visitor Details</h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Visitor</p>
                <p className="font-semibold">{selectedVisitor.visitor_name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Access Code</p>
                <p>{selectedVisitor.access_code}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={getVisitorStatus(selectedVisitor)} />
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Entry Time</p>
                <p>
                  {selectedVisitor.entry_time
                    ? new Date(selectedVisitor.entry_time).toLocaleString()
                    : "Not Entered"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Exit Time</p>
                <p>
                  {selectedVisitor.exit_time
                    ? new Date(selectedVisitor.exit_time).toLocaleString()
                    : "Still Inside"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedVisitor(null)}
              className="mt-6 w-full rounded-2xl bg-teal-500 px-4 py-3 font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
