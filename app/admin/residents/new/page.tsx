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
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");

  const [password, setPassword] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [createdResident, setCreatedResident] = useState<{
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
      const response = await fetch("/api/admin/create-resident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          houseNumber,
          street,
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

      setCreatedResident({
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

  function handleDialogClose() {
    setDialogOpen(false);

    setFullName("");
    setEmail("");
    setPhone("");
    setHouseNumber("");
    setStreet("");
    setPassword(generatePassword());
  }

  return (
    <AppShell size="default">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <Link
          href="/admin/residents"
          className="inline-flex w-fit items-center gap-2 rounded-xl px-2 py-1 text-sm text-slate-600 transition hover:text-teal-600 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Residents
        </Link>

        <PageHeader
          title="Add Resident"
          subtitle="Create a new resident account"
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

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  House Number
                </label>

                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Street</label>

                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-5 w-5" />

              {loading ? "Creating..." : "Create Resident"}
            </button>
          </form>
        </div>
      </div>

      <SuccessDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        title="Resident Created"
        description="The resident account has been created successfully."
        fullName={createdResident?.fullName ?? ""}
        email={createdResident?.email ?? ""}
        password={createdResident?.password ?? ""}
        phone={createdResident?.phone}
      />
    </AppShell>
  );
}
