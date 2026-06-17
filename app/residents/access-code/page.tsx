"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResidentBottomNav } from "../../components/ResidentBottomNav";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const qrRows = [
  "11111110010101101111111",
  "10000010011101001000001",
  "10111010001011101011101",
  "10111010110100001011101",
  "10111010011101101011101",
  "10000010101010101000001",
  "11111110101010101111111",
  "00000000110100100000000",
  "10101111100111011101010",
  "00110000111010100011101",
  "11101011110101101110110",
  "10001100001111001010001",
  "00111101111000111011101",
  "11100101001111100001110",
  "10010111100010011110101",
  "00111000111101100100110",
  "11101111001010111101111",
  "10000010110100001010100",
  "10111010100011101011101",
  "10111010011100101000110",
  "10111010110111101110111",
  "10000010001101001010010",
  "11111110111010101110101",
];

export default function AccessCodePage() {
  const searchParams = useSearchParams();
  const accessCode = searchParams.get("code");

  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");

  useEffect(() => {
    async function loadVisitor() {
      console.log("Access Code:", accessCode);

      if (!accessCode) return;

      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("access_code", accessCode)
        .single();

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        console.log(error);
        return;
      }

      setVisitorName(data.visitor_name);
      setVisitorPhone(data.visitor_phone);
    }

    loadVisitor();
  }, [accessCode]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 pb-32 lg:px-10 lg:pb-10 lg:pl-80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-md lg:max-w-3xl flex-col gap-8">
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
              Share code with your visitor
            </p>
          </div>
        </header>

        <section className="rounded-[2rem] bg-teal-50 p-6 dark:bg-teal-950/20">
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Visitor&apos;s access code
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {visitorPhone}
          </p>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            {visitorName || "Loading..."}
          </h2>
          <span className="mt-2 inline-flex rounded-md bg-teal-500 px-3 py-1.5 text-xs font-medium text-white">
            Authorised visitor
          </span>

          <div className="my-5 h-px bg-slate-300 dark:bg-slate-700" />

          <p className="text-sm text-slate-500 dark:text-slate-300">Expires</p>
          <p className="mt-2 text-base font-semibold tracking-wide">
            00h : 59m : 50s
          </p>
        </section>

        <section className="flex flex-col items-center text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Access code
          </p>
          <p className="mt-5 text-3xl font-bold tracking-wide">
            {" "}
            {accessCode}{" "}
          </p>

          <div
            aria-label="QR code for access code GIW-4959T"
            className="mt-7 grid aspect-square w-60 grid-cols-[repeat(23,minmax(0,1fr))] gap-0 bg-white p-0"
          >
            {qrRows.flatMap((row, rowIndex) =>
              row
                .split("")
                .map((cell, columnIndex) => (
                  <span
                    key={`${rowIndex}-${columnIndex}`}
                    className={cell === "1" ? "bg-black" : "bg-white"}
                  />
                )),
            )}
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
            type="button"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Revoke code
          </button>
        </div>
      </div>
      <ResidentBottomNav />
    </main>
  );
}
