"use client";

import { CheckCircle2, Copy, Mail, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { AnimatedDialog } from "./AnimatedDialog";

interface SuccessDialogProps {
 open: boolean;
 onClose: () => void;

 title: string;
 description?: string;

 fullName: string;
 email: string;
 password: string;
 phone?: string;
 accountLabel?: string;
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
 accountLabel = "account",
}: SuccessDialogProps) {
 const websiteUrl =
 process.env.NEXT_PUBLIC_SITE_URL ||
 (typeof window !== "undefined" ? window.location.origin : "");
 async function copyCredentials() {
 const credentials = `Welcome to Entriseq Estate Security, ${fullName}!

Your ${accountLabel} has been created successfully.

Use the login details below:

Name: ${fullName}

Email: ${email}

Temporary Password: ${password}

Login: ${websiteUrl}

When you log in, you will be prompted immediately to change your temporary password before continuing.`;

 await navigator.clipboard.writeText(credentials);

 toast.success("Credentials copied to clipboard.");
 }

 const whatsappMessage =
 encodeURIComponent(`Welcome to Entriseq Estate Security 🏡

Your ${accountLabel} has been created successfully.

Welcome, ${fullName}! Please use the login details below.

Name: ${fullName}

Email: ${email}

Temporary Password: ${password}

Login here: ${websiteUrl}

When you log in using these details, you will be prompted immediately to change your temporary password before continuing.

Welcome to Thomas Ajufo Estate.`);

 const emailSubject = encodeURIComponent(`Your Entriseq ${accountLabel}`);

 const emailBody = encodeURIComponent(`Welcome to Entriseq Estate Security, ${fullName}!

Your ${accountLabel} has been created successfully.

Email:
${email}

Temporary Password:
${password}

Login here:
${websiteUrl}

When you log in using these details, you will be prompted immediately to change your temporary password before continuing.

Thomas Ajufo Estate Administration`);

 return (
 <AnimatedDialog
 open={open}
 onClose={onClose}
 labelledBy="success-dialog-title"
 surfaceClassName="max-w-lg p-8"
 >
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

 <button type="button" onClick={onClose} aria-label="Close success dialog" className="apple-icon-button rounded-xl p-2 text-muted-foreground hover:text-foreground">
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

 <div>
 <p className="text-sm text-muted-foreground">Website</p>
 <a className="font-semibold text-primary hover:underline" href={websiteUrl}>
 {websiteUrl}
 </a>
 </div>
 </div>
 </div>

 <div className="mt-8 grid gap-3">
 <button
 type="button"
 onClick={copyCredentials}
 className="apple-secondary-button inline-flex items-center justify-center gap-2 rounded-2xl bg-card px-5 py-3 font-semibold text-foreground"
 >
 <Copy className="h-5 w-5" />
 Copy Credentials
 </button>

 {phone && (
 <a
 href={`https://wa.me/${phone}?text=${whatsappMessage}`}
 target="_blank"
 className="apple-primary-button inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
 >
 <MessageCircle className="h-5 w-5" />
 Send via WhatsApp
 </a>
 )}

 <a
 href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`}
 className="apple-primary-button inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
 >
 <Mail className="h-5 w-5" />
 Send via Email
 </a>

 <button
 type="button"
 onClick={onClose}
 autoFocus
 className="apple-secondary-button rounded-2xl border border-border px-5 py-3 font-semibold"
 >
 Done
 </button>
 </div>
 </AnimatedDialog>
 );
}
