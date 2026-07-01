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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <h2 className="text-xl font-bold">
          Verify Visitor
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Scan QR code or enter access code to verify visitor.
        </p>
<button
  type="button"
  onClick={scannerOpen}
  className="mx-auto mt-6 flex h-32 w-32 flex-col items-center justify-center rounded-3xl bg-teal-400 text-slate-800 transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
  aria-label="Scan QR Code"
>
  <span className="relative h-16 w-16" aria-hidden="true">
    <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-4 border-t-4 border-slate-700" />
    <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-4 border-t-4 border-slate-700" />
    <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-4 border-l-4 border-slate-700" />
    <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-4 border-r-4 border-slate-700" />
  </span>
</button>

<p className="mt-4 text-center text-base font-semibold">
  Scan QR Code
</p>

<div className="my-6 flex items-center gap-3">
  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
  <span className="text-sm text-slate-500">OR</span>
  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
</div>
        <input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Enter Access Code"
          className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
        />

        <button
          type="button"
          onClick={() => verifyCode()}
          className="mt-4 w-full rounded-2xl bg-teal-500 px-5 py-3 font-semibold text-white"
        >
          Verify Code
        </button>
      </div>

      {visitorName && (
        <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:bg-slate-900">

          <p className="text-sm text-slate-500">
            Visitor Found
          </p>

          <h3 className="mt-2 text-xl font-bold">
            {visitorName}
          </h3>

          <p className="mt-3 text-sm text-slate-600">
            Phone: {visitorPhone}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Plate Number: {plateNumber || "N/A"}
          </p>

          {isExpired ? (
            <p className="mt-4 font-medium text-red-600">
              🔴 Pass Expired
            </p>
          ) : status === "revoked" ? (
            <p className="mt-4 font-medium text-red-600">
              🔴 Access Revoked
            </p>
          ) : status === "pending" ? (
            <>
              <p className="mt-4 font-medium text-green-600">
                ✓ Valid Access Code
              </p>

              <button
                onClick={allowEntry}
                className="mt-4 w-full rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"
              >
                Allow Entry
              </button>
            </>
          ) : status === "entered" ? (
            <>
              <p className="mt-4 font-medium text-green-600">
                🟢 Visitor Already Inside
              </p>

              <button
                onClick={checkOutVisitor}
                className="mt-4 w-full rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-white"
              >
                Check Out Visitor
              </button>
            </>
          ) : (
            <p className="mt-4 font-medium text-slate-600">
              ⚪ Visitor Has Left
            </p>
          )}
        </div>
      )}
    </section>
  );
}