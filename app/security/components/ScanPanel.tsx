"use client";

import { useState } from "react";
import { QrCode, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ScanPanel() {
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [visitor, setVisitor] = useState<any>(null);

  const [error, setError] = useState("");

  async function verifyVisitor() {
    if (!accessCode.trim()) {
      setError("Please enter an access code.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .eq("access_code", accessCode)
      .maybeSingle();

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (!data) {
      setLoading(false);
      setError("Visitor not found.");
      setVisitor(null);
      return;
    }

    setVisitor(data);
    setLoading(false);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-bold">Verify Visitor</h2>

      <p className="mt-2 text-sm text-slate-500">
        Scan a QR code or enter the visitor's access code.
      </p>

      <div className="mt-6 flex h-56 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
        <div className="text-center">
          <QrCode className="mx-auto h-12 w-12 text-slate-400" />

          <p className="mt-3 text-sm text-slate-500">QR Scanner Coming Soon</p>
        </div>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />

        <span className="text-xs uppercase tracking-wide text-slate-400">
          OR
        </span>

        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <input
        type="text"
        placeholder="Enter 6-digit access code"
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800"
      />

      <button
        onClick={verifyVisitor}
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search className="h-5 w-5" />

        {loading ? "Verifying..." : "Verify Visitor"}
      </button>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {visitor && (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <h3 className="text-lg font-bold">Visitor Verified</h3>

          <div className="mt-4 space-y-2">
            <p>
              <strong>Name:</strong> {visitor.visitor_name}
            </p>

            <p>
              <strong>Phone:</strong> {visitor.visitor_phone}
            </p>

            <p>
              <strong>Plate:</strong> {visitor.plate_number || "N/A"}
            </p>

            <p>
              <strong>Status:</strong> {visitor.status}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
