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
        "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
    },
    error: {
      icon: <XCircle className="h-5 w-5" />,
      classes:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5" />,
      classes:
        "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      classes:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
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