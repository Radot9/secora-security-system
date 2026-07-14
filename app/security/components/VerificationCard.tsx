interface VerificationCardProps {
 accessCode: string;
 setAccessCode: (value: string) => void;
 verifyCode: () => void;

 scannerOpen: () => void;

 visitorName: string;
 visitorPhone: string;
 plateNumber: string;

 status: string;
 isExpired: boolean;

 allowEntry: () => void;
 checkOutVisitor: () => void;
}

export default function VerificationCard({
 accessCode,
 setAccessCode,
 verifyCode,
 scannerOpen,

 visitorName,
 visitorPhone,
 plateNumber,

 status,
 isExpired,

 allowEntry,
 checkOutVisitor,
}: VerificationCardProps) {
 return (
 <section className="space-y-5">
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">

 <h2 className="text-xl font-bold">
 Verify Visitor
 </h2>

 <p className="mt-2 text-sm text-muted-foreground">
 Scan QR code or enter access code to verify visitor.
 </p>
<button
 type="button"
 onClick={scannerOpen}
 className="mx-auto mt-6 flex h-32 w-32 flex-col items-center justify-center rounded-3xl bg-primary text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 aria-label="Scan QR Code"
>
 <span className="relative h-16 w-16" aria-hidden="true">
 <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-4 border-t-4 border-primary-foreground" />
 <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-4 border-t-4 border-primary-foreground" />
 <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-4 border-l-4 border-primary-foreground" />
 <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-4 border-r-4 border-primary-foreground" />
 </span>
</button>

<p className="mt-4 text-center text-base font-semibold">
 Scan QR Code
</p>

<div className="my-6 flex items-center gap-3">
 <div className="h-px flex-1 bg-muted" />
 <span className="text-sm text-muted-foreground">OR</span>
 <div className="h-px flex-1 bg-muted" />
</div>
 <input
 value={accessCode}
 onChange={(e) => setAccessCode(e.target.value)}
 placeholder="Enter Access Code"
 className="mt-5 w-full rounded-xl border border-border px-4 py-3"
 />

 <button
 type="button"
 onClick={() => verifyCode()}
 className="mt-4 w-full rounded-2xl bg-primary/100 px-5 py-3 font-semibold text-primary-foreground"
 >
 Verify Code
 </button>
 </div>

 {visitorName && (
 <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm">

 <p className="text-sm text-muted-foreground">
 Visitor Found
 </p>

 <h3 className="mt-2 text-xl font-bold">
 {visitorName}
 </h3>

 <p className="mt-3 text-sm text-muted-foreground">
 Phone: {visitorPhone}
 </p>

 <p className="mt-1 text-sm text-muted-foreground">
 Plate Number: {plateNumber || "N/A"}
 </p>

 {isExpired ? (
 <p className="mt-4 font-medium text-destructive">
 🔴 Pass Expired
 </p>
 ) : status === "revoked" ? (
 <p className="mt-4 font-medium text-destructive">
 🔴 Access Revoked
 </p>
 ) : status === "pending" ? (
 <>
 <p className="mt-4 font-medium text-primary">
 ✓ Valid Access Code
 </p>

 <button
 onClick={allowEntry}
 className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
 >
 Allow Entry
 </button>
 </>
 ) : status === "entered" ? (
 <>
 <p className="mt-4 font-medium text-primary">
 🟢 Visitor Already Inside
 </p>

 <button
 onClick={checkOutVisitor}
 className="mt-4 w-full rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground"
 >
 Check Out Visitor
 </button>
 </>
 ) : (
 <p className="mt-4 font-medium text-muted-foreground">
 ⚪ Visitor Has Left
 </p>
 )}
 </div>
 )}
 </section>
 );
}
