"use client";

import { X } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

export default function ScannerModal({
  open,
  onClose,
  onScan,
}: ScannerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-slate-900 p-6 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Scan Visitor QR Code
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl">
          <Scanner
            onScan={(results) => {
              if (!results.length) return;

              onScan(results[0].rawValue);
            }}
          />
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          Point the camera at the visitor QR code.
        </p>
      </div>
    </div>
  );
}