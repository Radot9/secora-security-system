"use client";

import {
 CheckCircle2,
 AlertCircle,
 XCircle,
 Info,
} from "lucide-react";

export type ToastType =
 | "success"
 | "error"
 | "warning"
 | "info";

interface ToastProps {
 show: boolean;
 type: ToastType;
 message: string;
}

export default function Toast({
 show,
 type,
 message,
}: ToastProps) {
 if (!show) return null;

 const variants = {
 success: {
 icon: <CheckCircle2 className="h-5 w-5" />,
 classes:
 "border-primary/30 bg-primary/10 text-primary",
 },
 error: {
 icon: <XCircle className="h-5 w-5" />,
 classes:
 "border-destructive/30 bg-destructive/10 text-destructive",
 },
 warning: {
 icon: <AlertCircle className="h-5 w-5" />,
 classes:
 "border-secondary bg-secondary text-secondary-foreground",
 },
 info: {
 icon: <Info className="h-5 w-5" />,
 classes:
 "border-accent bg-accent text-accent-foreground",
 },
 };

 return (
 <div className="fixed bottom-6 right-6 z-[9999]">

 <div
 className={`flex min-w-[320px] items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl ${variants[type].classes}`}
 >
 {variants[type].icon}

 <p className="flex-1 text-sm font-medium">
 {message}
 </p>

 </div>

 </div>
 );
}
