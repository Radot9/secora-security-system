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
 <section className="h-full rounded-3xl border border-border bg-card p-6 shadow-sm shadow-muted/50">
 <h2 className="text-xl font-bold">Verify Visitor</h2>
 <p className="mt-2 text-sm text-muted-foreground">
 Scan QR code or enter access code to verify visitor.
 </p>

 <button
 type="button"
 onClick={scannerOpen}
 className="mx-auto mt-6 flex h-36 w-36 flex-col items-center justify-center rounded-3xl bg-primary text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 aria-label="Scan QR Code"
 >
 <span className="relative h-16 w-16" aria-hidden="true">
 <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-4 border-t-4 border-primary-foreground" />
 <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-4 border-t-4 border-primary-foreground" />
 <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-4 border-l-4 border-primary-foreground" />
 <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-4 border-r-4 border-primary-foreground" />
 </span>
 </button>

 <p className="mt-4 text-center text-base font-semibold">Scan QR Code</p>

 <div className="my-6 flex items-center gap-3">
 <div className="h-px flex-1 bg-muted" />
 <span className="text-sm text-muted-foreground">OR</span>
 <div className="h-px flex-1 bg-muted" />
 </div>

 <form onSubmit={(event) => { event.preventDefault(); verifyCode(); }}>
 <input
 value={accessCode}
 onChange={(event) => setAccessCode(event.target.value)}
 placeholder="Enter Access Code"
 className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
 />

 <button
 type="submit"
 disabled={loading}
 className="mt-4 w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
 >
 {loading ? "Verifying..." : "Verify Code"}
 </button>
 </form>
 </section>
 );
}
