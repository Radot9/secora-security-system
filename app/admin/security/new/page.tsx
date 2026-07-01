"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "@/app/components/ui/AppShell";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Toaster, toast } from "sonner";
import { generatePassword } from "@/lib/utils/generatePassword";
import SuccessDialog from "@/app/components/ui/SuccessDialog";

export default function NewResidentPage() {
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gate, setGate] = useState("");
  const [team, setTeam] = useState("");
  const [password, setPassword] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [createdOfficer, setCreatedOfficer] = useState<{
    fullName: string;
    email: string;
    phone: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    setPassword(generatePassword());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/admin/create-security", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          gate,
          team,
        }),
      });

      const result = await response.json();

      //Duplicate email error handling
      if (!response.ok) {
        if (result.error?.toLowerCase().includes("already")) {
          toast.warning("A resident with this email address already exists.");
        } else {
          toast.error(result.error);
        }

        return;
      }

      setCreatedOfficer({
        fullName,
        email,
        phone,
        password,
      });

      // Open the success dialog
      setDialogOpen(true);
    } catch (error) {
      console.error(error);

      toast.error("Unable to create resident.");
    } finally {
      setLoading(false);
    }
  }

  // Reset the form after the success dialog is closed
  function handleDialogClose() {
    setDialogOpen(false);

    setFullName("");
    setEmail("");
    setPhone("");

    // Reset security-specific fields
    setGate("");
    setTeam("");

    // Generate a new temporary password
    setPassword(generatePassword());

    // Clear the created officer information
    setCreatedOfficer(null);
  }

  return (
    <AppShell size="default">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <Link
          href="/admin/security"
          className="inline-flex w-fit items-center gap-2 rounded-xl px-2 py-1 text-sm text-slate-600 transition hover:text-teal-600 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Security Personnel
        </Link>

        <PageHeader
          title="Add Security Officer"
          subtitle="Create a new security personnel account"
        />

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email Address
              </label>

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Temporary Password
                </label>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className="flex-1 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-800"
                  />

                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="rounded-2xl bg-slate-700 px-4 text-white transition hover:bg-slate-800"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Gate Assignment
              </label>

              <select
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Select Gate</option>

                <option value="Main Gate">Main Gate</option>

                <option value="Small Gate">Small Gate</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">
                Duty Team
              </label>

              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Select Team</option>

                <option value="Team A">Team A</option>

                <option value="Team B">Team B</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-5 w-5" />

              {loading ? "Creating..." : "Create Security Officer"}
            </button>
          </form>
        </div>
      </div>

      <SuccessDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        title="Security Officer Created"
        description="The security officer account has been created successfully."
        fullName={createdOfficer?.fullName ?? ""}
        email={createdOfficer?.email ?? ""}
        password={createdOfficer?.password ?? ""}
        phone={createdOfficer?.phone}
      />
    </AppShell>
  );
}
