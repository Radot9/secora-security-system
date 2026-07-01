"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, UserPlus, Users, Home, Phone } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Resident } from "@/types/resident";

import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";

export default function ResidentsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);

  async function loadResidents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("residents")
      .select(
        `
      id,
      full_name,
      email,
      phone,
      house_number,
      street,
      is_active
    `,
      )
      .order("full_name");

    if (!error && data) {
      setResidents(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadResidents();
  }, []);

  const filteredResidents = residents.filter((resident) => {
    const query = search.toLowerCase();

    return (
      resident.full_name.toLowerCase().includes(query) ||
      resident.phone.toLowerCase().includes(query) ||
      resident.house_number.toLowerCase().includes(query)
    );
  });

  return (
    <AppShell size="default">
      <div className="flex flex-col gap-6">
        <PageHeader title="Residents" subtitle="Manage estate residents" />

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
              placeholder="Search by name, phone or house..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-14 pr-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <Link
            href="/admin/residents/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-semibold text-white transition hover:bg-teal-600"
          >
            <UserPlus className="h-5 w-5" />
            Add Resident
          </Link>
        </div>

        {/* Residents List */}

        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="flex justify-center py-16">
              Loading residents...
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <Users className="h-10 w-10 text-slate-400" />

              <p className="text-slate-500">No residents found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredResidents.map((resident) => (
                <article
                  key={resident.id}
                  className="flex items-center justify-between px-6 py-5 transition rounded-[2rem] hover:bg-slate-800 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <h2 className="font-semibold">{resident.full_name}</h2>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        {resident.house_number}, {resident.street}
                      </span>

                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />

                        {resident.phone}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      resident.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {resident.is_active ? "Active" : "Inactive"}
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
