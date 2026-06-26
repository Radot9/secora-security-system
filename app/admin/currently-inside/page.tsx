"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { AppShell } from "@/app/components/ui/AppShell";

type Visitor = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  plate_number: string;
  entry_time: string;
  status: string;
};

export default function CurrentlyInsidePage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    async function loadVisitors() {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("status", "entered")
        .order("entry_time", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setVisitors(data || []);
    }

    loadVisitors();
  }, []);

  return (
    <AppShell size="wide">
      <h1 className="mb-6 text-2xl font-bold">Currently Inside</h1>

      <div className="space-y-4">
        {visitors.length === 0 ? (
          <EmptyState
            title="No Visitors Inside"
            description="There are currently no visitors inside the estate."
          />
        ) : (
          visitors.map((visitor) => (
            <Card key={visitor.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {visitor.visitor_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {visitor.visitor_phone}
                  </p>
                </div>

                <StatusBadge status={visitor.status} />
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600">
                  Plate: {visitor.plate_number || "N/A"}
                </p>

                <p className="text-sm text-slate-600">
                  Entered: {new Date(visitor.entry_time).toLocaleString()}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
