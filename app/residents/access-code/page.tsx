"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";

type Visitor = {
  visitor_name: string;
  visitor_phone: string;
  plate_number: string | null;
  expires_at: string | null;
};

function AccessCodeContent() {
  const searchParams = useSearchParams();
  const accessCode = searchParams.get("code");
  const [qrValue, setQrValue] = useState("");

  const [visitor, setVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    async function loadVisitor() {
      if (!accessCode) return;

      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("access_code", accessCode)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setVisitor({
        visitor_name: data.visitor_name,
        visitor_phone: data.visitor_phone,
        plate_number: data.plate_number,
        expires_at: data.expires_at,
      });
    }

    loadVisitor();
  }, [accessCode]);

  useEffect(() => {
    if (!accessCode) return;

    setQrValue(`${window.location.origin}/security?code=${accessCode}`);
  }, [accessCode]);

  if (!visitor) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">Loading visitor...</p>
      </main>
    );
  }

  async function revokeCode() {
    if (!accessCode) return;

    const { error } = await supabase
      .from("visitors")
      .update({
        status: "revoked",
      })
      .eq("access_code", accessCode);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Access code revoked");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-3xl flex-col gap-8">
        <header className="flex items-start gap-3">
          <Link
            href="/residents"
            aria-label="Back to residents"
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
              Share this code with your visitor
            </p>
          </div>
        </header>

        <section className="rounded-[2rem] bg-teal-50 p-6 dark:bg-teal-950/20">
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Authorised Visitor
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {visitor.visitor_name}
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {visitor.visitor_phone}
          </p>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Plate Number: {visitor.plate_number || "N/A"}
          </p>

          <span className="mt-4 inline-flex rounded-md bg-teal-500 px-3 py-1.5 text-xs font-medium text-white">
            Authorised Visitor
          </span>

          <div className="my-5 h-px bg-slate-300 dark:bg-slate-700" />

          <p className="text-sm text-slate-500 dark:text-slate-300">Expires</p>

          <p className="mt-2 text-base font-semibold">
            {visitor.expires_at
              ? new Date(visitor.expires_at).toLocaleString()
              : "No expiry set"}
          </p>
        </section>

        <section className="flex flex-col items-center text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Access Code
          </p>

          <p className="mt-5 text-3xl font-bold tracking-[0.2em]">
            {accessCode}
          </p>

          <div className="mt-8 rounded-2xl bg-white p-4">
            <QRCode value={qrValue} size={220} />
          </div>
        </section>

        <div className="mt-4 space-y-4 px-5">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            Share Code
          </button>

          <button
            type="button" onClick={revokeCode} 
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Revoke Code
          </button>
        </div>
      </div>

      <ResidentBottomNav />
    </main>
  );
}

export default function AccessCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccessCodeContent />
    </Suspense>
  );
}
