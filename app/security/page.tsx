"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  ShieldX,
  LogOut,
  UserPlus,
  UserMinus,
} from "lucide-react";

import ScannerModal from "./components/ScannerModal";
import ActivityTable from "./components/ActivityTable";
import VerificationCard from "./components/VerificationCard";
import VisitorDetailsModal from "./components/VisitorDetailsModal";
import { SecurityOfficer } from "@/types/security";

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [officer, setOfficer] = useState<SecurityOfficer | null>(null);
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
  const code = String(codeToVerify ?? "").trim();

  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("access_code", code)
    .maybeSingle();

  if (error) {
    alert(error.message);
    return;
  }

  if (!data) {
    alert(`Code "${code}" was not found.`);
    return;
  }

  setVisitorName(data.visitor_name);
  setVisitorPhone(data.visitor_phone);
  setPlateNumber(data.plate_number);
  setVisitorId(data.id);
  setStatus(data.status);
  setIsExpired(
    data.expires_at
      ? new Date(data.expires_at) < new Date()
      : false
  );
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

        <section>
          <VerificationCard
            accessCode={accessCode}
            setAccessCode={setAccessCode}
            verifyCode={verifyCode}
            scannerOpen={() => setScannerOpen(true)}
            visitorName={visitorName}
            visitorPhone={visitorPhone}
            plateNumber={plateNumber}
            status={status}
            isExpired={isExpired}
            allowEntry={allowEntry}
            checkOutVisitor={checkOutVisitor}
          />
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

        <ActivityTable
          activity={activity}
          setSelectedVisitor={setSelectedVisitor}
          getVisitorStatus={getVisitorStatus}
        />
      </div>

      <VisitorDetailsModal
        visitor={selectedVisitor}
        visitorStatusConfig={visitorStatusConfig}
        StatusIcon={StatusIcon}
        onClose={() => setSelectedVisitor(null)}
      />
      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={async (value) => {
          let scannedCode = value;

          // If the QR contains a URL, extract ?code=
          if (value.startsWith("http")) {
            try {
              const url = new URL(value);
              scannedCode = url.searchParams.get("code") || "";
            } catch {
              // Ignore invalid URLs
            }
          }

          setAccessCode(scannedCode);

          await verifyCode(scannedCode);

          setScannerOpen(false);
        }}
      />
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
