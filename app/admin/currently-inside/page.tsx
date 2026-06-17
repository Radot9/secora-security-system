"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Visitor = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  plate_number: string;
  entry_time: string;
};

export default function CurrentlyInsidePage() {
  const quickActions = [
    {
      label: "Currently Inside",
      href: "/admin/currently-inside",
      description: "View visitors currently inside the estate",
    },
  ];

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
    <main className="p-10">
      <h1 className="mb-6 text-2xl font-bold">Currently Inside</h1>

      <div className="space-y-4">
        {visitors.map((visitor) => (
          <div key={visitor.id} className="rounded-xl border p-4">
            <h2 className="font-semibold">{visitor.visitor_name}</h2>

            <p className="text-sm text-slate-600">{visitor.visitor_phone}</p>

            <p className="text-sm text-slate-600">
              Plate: {visitor.plate_number || "N/A"}
            </p>

            <p className="text-sm text-slate-600">
              Entered: {new Date(visitor.entry_time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
