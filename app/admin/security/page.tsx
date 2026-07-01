"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Shield, Phone, CalendarDays } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { SecurityOfficer } from "@/types/security";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [officers, setOfficers] = useState<SecurityOfficer[]>([]);

  async function loadSecurityPersonnel() {
    setLoading(true);

    const { data, error } = await supabase
      .from("security_personnel")
      .select(
        `
id,
full_name,
email,
phone,
gate,
shift,
is_active
`,
      )
      .order("full_name");

    if (!error && data) {
      setOfficers(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSecurityPersonnel();
  }, []);

  const filteredOfficers = officers.filter((officer) => {
    const query = search.toLowerCase();

    return (
      officer.full_name.toLowerCase().includes(query) ||
      officer.phone.toLowerCase().includes(query) ||
      officer.gate.toLowerCase().includes(query)
    );
  });
  return (
    <AppShell size="default">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Security Personnel"
          subtitle="Manage estate security officers"
        />

        {/* Search + Add Button */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={20} />
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or gate..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-14 pr-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <Link
            href="/admin/security/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-semibold text-white transition hover:bg-teal-600"
          >
            <Shield className="h-5 w-5" />
            Add Security Officer
          </Link>
        </div>

        {/* Security Personnel List */}

        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="flex justify-center py-16">
              Loading security officers...
            </div>
          ) : filteredOfficers.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <Shield className="h-10 w-10 text-slate-400" />

              <p className="text-slate-500">No security officers found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredOfficers.map((officer) => (
                <article
                  key={officer.id}
                  className="flex items-center justify-between px-6 py-5 transition rounded-[2rem] hover:bg-slate-800 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <h2 className="font-semibold">{officer.full_name}</h2>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          {officer.gate}
                        </span>

                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {officer.team}
                        </span>

                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {officer.phone}
                        </span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />

                        {officer.phone}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      officer.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {officer.is_active ? "Active" : "Inactive"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
