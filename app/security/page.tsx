"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, ShieldX, LogOut } from "lucide-react";


function StatIcon({ icon, tone }: { icon: string; tone: string }) {
  const isDanger = tone === "red";
  const colorClass = isDanger
    ? "bg-red-50 text-red-500"
    : "bg-teal-50 text-teal-500";

  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}
    >
      {icon === "clock" ? (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      ) : icon === "shield-x" ? (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6l-7-3Z" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="10" cy="8" r="3" />
          <path d="M4 19c.6-3 2.7-5 6-5s5.4 2 6 5" />
          <path
            d={icon === "person-plus" ? "M18 7v5M15.5 9.5h5" : "M15.5 9.5h5"}
          />
        </svg>
      )}
    </span>
  );
}

function SecurityContent() {
  const [accessCode, setAccessCode] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [status, setStatus] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  type ActivityItem = {
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

  const [selectedVisitor, setSelectedVisitor] = useState<ActivityItem | null>(
    null,
  );

  const statusConfig = {
    entered: {
      title: "Valid Pass",
      message: "Visitor is authorised",
      color: "text-green-500",
      icon: CheckCircle2,
    },

    pending: {
      title: "Pending Entry",
      message: "Visitor has not entered yet",
      color: "text-blue-500",
      icon: Clock3,
    },

    exited: {
      title: "Visitor Checked Out",
      message: "Visitor has left the estate",
      color: "text-slate-500",
      icon: LogOut,
    },

    expired: {
      title: "Pass Expired",
      message: "Visitor pass is no longer valid",
      color: "text-amber-500",
      icon: Clock3,
    },

    revoked: {
      title: "Access Revoked",
      message: "Visitor access has been cancelled",
      color: "text-red-500",
      icon: ShieldX,
    },
  };
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [stats, setStats] = useState([
    {
      label: "Visitors checked in",
      value: "0",
      tone: "teal",
      icon: "person-plus",
    },
    {
      label: "Visitors checked out",
      value: "0",
      tone: "teal",
      icon: "person-minus",
    },
    {
      label: "Currently inside",
      value: "0",
      tone: "teal",
      icon: "clock",
    },
    {
      label: "Expired passes",
      value: "0",
      tone: "red",
      icon: "shield-x",
    },
  ]);

  const searchParams = useSearchParams();
  const qrCode = searchParams.get("code");

  useEffect(() => {
    if (!qrCode) return;

    setAccessCode(qrCode);

    setTimeout(() => {
      verifyCode(qrCode);
    }, 100);
  }, [qrCode]);

  useEffect(() => {
    async function loadStats() {
      const { count: checkedIn } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("status", "entered");

      const { count: checkedOut } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("status", "exited");

      const { count: currentlyInside } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("status", "entered");

      const { count: expiredPasses } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .lt("expires_at", new Date().toISOString());

      const { data: visitors } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setActivity(visitors || []);
      setStats([
        {
          label: "Visitors checked in",
          value: String(checkedIn ?? 0),
          tone: "teal",
          icon: "person-plus",
        },
        {
          label: "Visitors checked out",
          value: String(checkedOut ?? 0),
          tone: "teal",
          icon: "person-minus",
        },
        {
          label: "Currently inside",
          value: String(currentlyInside ?? 0),
          tone: "teal",
          icon: "clock",
        },
        {
          label: "Expired passes",
          value: String(expiredPasses ?? 0),
          tone: "red",
          icon: "shield-x",
        },
      ]);
    }

    loadStats();
  }, []);

  async function verifyCode(codeToVerify = accessCode) {
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .eq("access_code", codeToVerify)
      .single();

    if (error) {
      alert("Invalid access code");
      return;
    }

    setVisitorName(data.visitor_name);
    setVisitorPhone(data.visitor_phone);
    setPlateNumber(data.plate_number);
    setVisitorId(data.id);
    setStatus(data.status);
    setIsExpired(new Date(data.expires_at) < new Date());
  }

  async function allowEntry() {
    if (!visitorId) return;

    const { error } = await supabase
      .from("visitors")
      .update({
        status: "entered",
        entry_time: new Date().toISOString(),
      })
      .eq("id", visitorId);

    if (error) {
      alert(error.message);
      return;
    }
    setStatus("entered");
    alert("Visitor checked in successfully");
  }

  async function checkOutVisitor() {
    if (!visitorId) return;

    const { error } = await supabase
      .from("visitors")
      .update({
        status: "exited",
        exit_time: new Date().toISOString(),
      })
      .eq("id", visitorId);

    if (error) {
      alert(error.message);
      return;
    }

    setStatus("exited");

    alert("Visitor checked out successfully");
  }

  function getVisitorStatus(visitor: ActivityItem) {
    if (
      visitor.status === "pending" &&
      visitor.expires_at &&
      new Date(visitor.expires_at) < new Date()
    ) {
      return "expired";
    }

    return visitor.status;
  }

  const visitorStatusConfig = selectedVisitor
    ? statusConfig[
        getVisitorStatus(selectedVisitor) as keyof typeof statusConfig
      ] || statusConfig.pending
    : statusConfig.pending;

  const StatusIcon = visitorStatusConfig.icon;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-col gap-8">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-bold text-teal-700 shadow-sm shadow-teal-100/70 dark:bg-teal-950/20 dark:text-teal-300">
            MM
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Security Officer
            </p>
          </div>
        </header>

        <section className="rounded-4xl bg-teal-50 p-5 dark:bg-teal-950/20">
          <h2 className="text-2xl font-bold tracking-tight">Verify Visitor</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-300">
            Scan QR code or enter access code to verify visitor.
          </p>

          <Link
            href="#"
            className="mx-auto mt-6 flex h-32 w-32 flex-col items-center justify-center rounded-3xl bg-teal-400 text-slate-800 transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Scan QR Code"
          >
            <span className="relative h-16 w-16" aria-hidden="true">
              <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-4 border-t-4 border-slate-700" />
              <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-4 border-t-4 border-slate-700" />
              <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-4 border-l-4 border-slate-700" />
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-4 border-r-4 border-slate-700" />
            </span>
          </Link>
          <p className="mt-4 text-center text-base font-semibold">
            Scan QR Code
          </p>
          <div className="mt-6 space-y-3">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

            <button
              type="button"
              onClick={() => verifyCode()}
              className="w-full rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Verify Code
            </button>
            {visitorName && (
              <div className="rounded-2xl border border-teal-200 bg-white p-4">
                <p className="text-sm text-slate-500">Visitor Found</p>

                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {visitorName}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Phone: {visitorPhone}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Plate Number: {plateNumber || "N/A"}
                </p>

                {isExpired ? (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    🔴 Pass Expired
                  </p>
                ) : status === "revoked" ? (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    🔴 Access Revoked
                  </p>
                ) : status === "pending" ? (
                  <>
                    <p className="mt-3 text-sm font-medium text-green-600">
                      ✓ Valid Access Code
                    </p>

                    <button
                      type="button"
                      onClick={allowEntry}
                      className="mt-4 w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Allow Entry
                    </button>
                  </>
                ) : status === "entered" ? (
                  <>
                    <p className="mt-3 text-sm font-medium text-green-600">
                      🟢 Visitor Already Inside
                    </p>

                    <button
                      type="button"
                      onClick={checkOutVisitor}
                      className="mt-4 w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Check Out Visitor
                    </button>
                  </>
                ) : (
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    ⚪ Visitor Has Left
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight">
            Today&apos;s Activity
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-5">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10"
              >
                <StatIcon icon={stat.icon} tone={stat.tone} />
                <p className="mt-6 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">
              Recent Verification
            </h2>
            <button
              type="button"
              className="text-sm font-medium text-teal-600 transition hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200"
            >
              View all
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10">
            {activity.map((item) => {
              const displayStatus = getVisitorStatus(item);

              const isDenied =
                displayStatus === "expired" || displayStatus === "revoked";

              function getActivityStatus(item: ActivityItem) {
                if (
                  item.status === "pending" &&
                  item.expires_at &&
                  new Date(item.expires_at) < new Date()
                ) {
                  return "expired";
                }

                return item.status;
              }

              return (
                <article
                  key={item.id}
                  onClick={() => {
                    console.log(item);
                    setSelectedVisitor(item);
                  }}
                  className="cursor-pointer flex items-center gap-4 border-b border-slate-200 px-5 py-5 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      isDenied
                        ? "bg-red-50 text-red-500"
                        : "bg-teal-50 text-teal-500"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {isDenied ? (
                        <path d="m6 6 12 12M18 6 6 18" />
                      ) : (
                        <path d="m5 13 4 4L19 7" />
                      )}
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{item.visitor_name}</h3>

                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                      Code: {item.access_code} •{" "}
                      <span
                        className={
                          displayStatus === "entered"
                            ? "text-green-600 font-semibold"
                            : displayStatus === "pending"
                              ? "text-blue-600 font-semibold"
                              : displayStatus === "expired"
                                ? "text-amber-600 font-semibold"
                                : displayStatus === "revoked"
                                  ? "text-red-600 font-semibold"
                                  : "text-slate-600 font-semibold"
                        }
                      >
                        {displayStatus}
                      </span>
                    </p>
                  </div>

                  <time className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </time>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {selectedVisitor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedVisitor(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${visitorStatusConfig.color}`}
              >
                <StatusIcon className="h-10 w-10" />
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                {visitorStatusConfig.title}
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {visitorStatusConfig.message}
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Visitor</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.visitor_name}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Phone Number</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.visitor_phone || "N/A"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Plate Number</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.plate_number || "N/A"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Resident</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.resident_name || "N/A"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Access Code</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.access_code}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Entry Time</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.entry_time
                      ? new Date(selectedVisitor.entry_time).toLocaleString()
                      : "Not entered"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Exit Time</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.exit_time
                      ? new Date(selectedVisitor.exit_time).toLocaleString()
                      : "Still inside"}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm text-slate-500">Expires</p>
                  <p className="mt-1 font-semibold">
                    {selectedVisitor.expires_at
                      ? new Date(selectedVisitor.expires_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
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
    </main>
  );
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecurityContent />
    </Suspense>
  );
}
