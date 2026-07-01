"use client";

import { CheckCircle2, Copy, Mail, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;

  title: string;
  description?: string;

  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export default function SuccessDialog({
  open,
  onClose,
  title,
  description,
  fullName,
  email,
  password,
  phone,
}: SuccessDialogProps) {
  if (!open) return null;

  async function copyCredentials() {
    const credentials = `Name: ${fullName}

Email: ${email}

Temporary Password: ${password}`;

    await navigator.clipboard.writeText(credentials);

    toast.success("Credentials copied to clipboard.");
  }

  const whatsappMessage =
    encodeURIComponent(`Welcome to Secora Security System 🏡

Your resident account has been created successfully.

Name: ${fullName}

Email: ${email}

Temporary Password: ${password}

Please change your password after your first login.

Welcome to Thomas Ajufo Estate.`);

  const emailSubject = encodeURIComponent("Your Secora Resident Account");

  const emailBody = encodeURIComponent(`Hello ${fullName},

Welcome to Secora.

Your resident account has been created successfully.

Email:
${email}

Temporary Password:
${password}

Please change your password after your first login.

Thomas Ajufo Estate Administration`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold">{title}</h2>

              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
          </div>

          <button onClick={onClose}>
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Resident</p>
              <p className="font-semibold">{fullName}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-semibold">{email}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Temporary Password</p>

              <p className="font-mono text-lg font-bold text-teal-600">
                {password}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          <button
            onClick={copyCredentials}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <Copy className="h-5 w-5" />
            Copy Credentials
          </button>

          {phone && (
            <a
              href={`https://wa.me/${phone}?text=${whatsappMessage}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" />
              Send via WhatsApp
            </a>
          )}

          <a
            href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <Mail className="h-5 w-5" />
            Send via Email
          </a>

          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
