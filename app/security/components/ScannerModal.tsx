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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4">
 <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl">

 <div className="mb-6 flex items-center justify-between">
 <h2 className="text-xl font-semibold text-foreground">
 Scan Visitor QR Code
 </h2>

 <button
 onClick={onClose}
 className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
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

 <p className="mt-5 text-center text-sm text-muted-foreground">
 Point the camera at the visitor QR code.
 </p>
 </div>
 </div>
 );
}
