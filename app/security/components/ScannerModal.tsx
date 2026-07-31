"use client";

import { X } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { AnimatedDialog } from "@/app/components/ui/AnimatedDialog";

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
 return (
 <AnimatedDialog
 open={open}
 onClose={onClose}
 labelledBy="scanner-dialog-title"
 surfaceClassName="max-w-lg p-4 sm:p-6"
 >
 <div className="mb-4 flex items-center justify-between sm:mb-6">
 <h2 id="scanner-dialog-title" className="text-xl font-semibold text-foreground">
 Scan Visitor QR Code
 </h2>

 <button
 type="button"
 onClick={onClose}
 aria-label="Close QR scanner"
 className="apple-icon-button rounded-xl p-2 text-muted-foreground hover:text-foreground"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="mx-auto w-full overflow-hidden rounded-2xl">
 <Scanner
 styles={{
 container: {
 width: "min(100%, calc(var(--dialog-viewport-height, 100dvh) - 10rem))",
 height: "auto",
 margin: "0 auto",
 },
 }}
 onScan={(results) => {
 if (!results.length) return;

 onScan(results[0].rawValue);
 }}
 />
 </div>

 <p className="mt-4 text-center text-sm text-muted-foreground sm:mt-5">
 Point the camera at the visitor QR code.
 </p>
 </AnimatedDialog>
 );
}
