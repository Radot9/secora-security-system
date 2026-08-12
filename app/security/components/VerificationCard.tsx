interface VerificationCardProps {
 accessCode: string;
 setAccessCode: (value: string) => void;
 verifyCode: () => void;
 scannerOpen: () => void;
 loading?: boolean;
}

export default function VerificationCard({
 accessCode,
 setAccessCode,
 verifyCode,
 scannerOpen,
 loading = false,
}: VerificationCardProps) {
 return (
 <section className="h-full rounded-3xl border border-border bg-card p-4 shadow-sm shadow-muted/50 sm:p-6">
 <h2 className="text-lg font-bold sm:text-xl">Verify Visitor</h2>
 <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
 Scan QR code or enter access code to verify visitor.
 </p>

 <button
 type="button"
 onClick={scannerOpen}
 className="mx-auto mt-4 flex h-24 w-24 flex-col items-center justify-center rounded-3xl bg-primary text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring sm:mt-6 sm:h-36 sm:w-36"
 aria-label="Scan QR Code"
 >
 <span className="relative h-12 w-12 sm:h-16 sm:w-16" aria-hidden="true">
 <span className="absolute left-0 top-0 h-4 w-4 rounded-tl-md border-l-[3px] border-t-[3px] border-primary-foreground sm:h-5 sm:w-5 sm:border-l-4 sm:border-t-4" />
 <span className="absolute right-0 top-0 h-4 w-4 rounded-tr-md border-r-[3px] border-t-[3px] border-primary-foreground sm:h-5 sm:w-5 sm:border-r-4 sm:border-t-4" />
 <span className="absolute bottom-0 left-0 h-4 w-4 rounded-bl-md border-b-[3px] border-l-[3px] border-primary-foreground sm:h-5 sm:w-5 sm:border-b-4 sm:border-l-4" />
 <span className="absolute bottom-0 right-0 h-4 w-4 rounded-br-md border-b-[3px] border-r-[3px] border-primary-foreground sm:h-5 sm:w-5 sm:border-b-4 sm:border-r-4" />
 </span>
 </button>

 <p className="mt-3 text-center text-sm font-semibold sm:mt-4 sm:text-base">Scan QR Code</p>

 <div className="my-4 flex items-center gap-3 sm:my-6">
 <div className="h-px flex-1 bg-muted" />
 <span className="text-sm text-muted-foreground">OR</span>
 <div className="h-px flex-1 bg-muted" />
 </div>

 <form onSubmit={(event) => { event.preventDefault(); verifyCode(); }}>
 <input
 value={accessCode}
 onChange={(event) => setAccessCode(event.target.value)}
 placeholder="Enter Access Code"
 className="min-h-11 w-full rounded-2xl border border-border bg-background px-4 py-2.5 outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:py-3"
 />

 <button
 type="submit"
 disabled={loading}
 className="mt-3 min-h-11 w-full rounded-2xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring sm:mt-4 sm:py-3"
 >
 {loading ? "Verifying..." : "Verify Code"}
 </button>
 </form>
 </section>
 );
}
