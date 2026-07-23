"use client";

import { CheckCircle2, Copy, Mail, MessageCircle, X } from "lucide-react";
import { useEffect } from "react";
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
 useEffect(() => {
 if (!open) return;
 const closeOnEscape = (event: KeyboardEvent) => {
 if (event.key === "Escape") onClose();
 };
 window.addEventListener("keydown", closeOnEscape);
 return () => window.removeEventListener("keydown", closeOnEscape);
 }, [onClose, open]);

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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-5" role="presentation">
 <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="success-dialog-title">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-3">
 <div className="rounded-full bg-primary/15 p-3">
 <CheckCircle2 className="h-8 w-8 text-primary" />
 </div>

 <div>
 <h2 id="success-dialog-title" className="text-xl font-bold">{title}</h2>

 {description && (
 <p className="mt-1 text-sm text-muted-foreground">{description}</p>
 )}
 </div>
 </div>

 <button type="button" onClick={onClose} aria-label="Close success dialog" className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
 <X className="h-6 w-6 text-muted-foreground" />
 </button>
 </div>

 <div className="mt-8 rounded-2xl bg-background p-5">
 <div className="space-y-4">
 <div>
 <p className="text-sm text-muted-foreground">Resident</p>
 <p className="font-semibold">{fullName}</p>
 </div>

 <div>
 <p className="text-sm text-muted-foreground">Email</p>
 <p className="font-semibold">{email}</p>
 </div>

 <div>
 <p className="text-sm text-muted-foreground">Temporary Password</p>

 <p className="font-mono text-lg font-bold text-primary">
 {password}
 </p>
 </div>
 </div>
 </div>

 <div className="mt-8 grid gap-3">
 <button
 type="button"
 onClick={copyCredentials}
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-card px-5 py-3 font-semibold text-foreground transition hover:bg-muted"
 >
 <Copy className="h-5 w-5" />
 Copy Credentials
 </button>

 {phone && (
 <a
 href={`https://wa.me/${phone}?text=${whatsappMessage}`}
 target="_blank"
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
 >
 <MessageCircle className="h-5 w-5" />
 Send via WhatsApp
 </a>
 )}

 <a
 href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`}
 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
 >
 <Mail className="h-5 w-5" />
 Send via Email
 </a>

 <button
 type="button"
 onClick={onClose}
 autoFocus
 className="rounded-2xl border border-border px-5 py-3 font-semibold transition hover:bg-muted"
 >
 Done
 </button>
 </div>
 </div>
 </div>
 );
}
