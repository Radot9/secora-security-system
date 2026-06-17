"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import visitors from "../../data/visitors.json";

export default function GenerateCodePage() {
  const [visitorName, setVisitorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleGenerateCode() {
    setLoading(true);

    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase.from("visitors").insert({
      visitor_name: visitorName,
      visitor_phone: phoneNumber,
      plate_number: plateNumber,
      resident_name: "Michael",
      access_code: accessCode,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/residents/access-code?code=${accessCode}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-5xl flex-col gap-8">
        <header className="flex items-start gap-3">
          <Link
            href="/residents"
            aria-label="Back to visitors"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 rotate-45 border-b-2 border-l-2 border-slate-700 dark:border-slate-200"
            />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Access Code Generated
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Generate code for your guest
            </p>
          </div>
        </header>

        <section className="rounded-[2rem] bg-teal-50 p-5 dark:bg-teal-950/20">
          <form className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="visitor-name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Visitor&apos;s name
              </label>
              <input
                id="visitor-name"
                type="text"
                value={visitorName}
                onChange={(event) => setVisitorName(event.target.value)}
                placeholder="Enter visitor's name"
                autoComplete="name"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="visitor-phone"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Visitor&apos;s phone number
              </label>
              <input
                id="visitor-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter phone number"
                autoComplete="tel"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="plate-number"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Visitor&apos;s vehicle plate number
              </label>
              <input
                id="plate-number"
                type="text"
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value)}
                placeholder="Enter plate number"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Code"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
          <div className="flex items-center justify-between px-4 py-5">
            <h2 className="text-lg font-semibold tracking-tight">Visitors</h2>
            <Link
              href="/residents/visitors"
              className="text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200"
            >
              View all
            </Link>
          </div>

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
