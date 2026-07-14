import Link from "next/link";

const details = [
 {
 label: "Visitor",
 value: "Christopher James",
 icon: (
 <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
 <circle cx="12" cy="7" r="3" />
 <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" />
 </svg>
 ),
 },
 {
 label: "Host (Resident)",
 value: "Michael Jackson",
 icon: (
 <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="m4 10 8-6 8 6" />
 <path d="M6 10v9h12v-9" />
 <path d="M10 19v-5h4v5" />
 <path d="M8 12h2M14 12h2" />
 </svg>
 ),
 },
 {
 label: "Address",
 value: "2, Ofili Close, Thomas Ajufo Estate",
 icon: (
 <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
 <circle cx="12" cy="10" r="2.5" />
 </svg>
 ),
 },
 {
 label: "Valid Until",
 value: "Today, 11:30 AM",
 icon: (
 <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
 <circle cx="12" cy="12" r="8" />
 <path d="M12 8v5l3 2" />
 </svg>
 ),
 },
 {
 label: "Access Code",
 value: "GIW-4959T",
 icon: (
 <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7z" />
 <path d="M14 14h1.5v1.5H17V17h-3z" />
 <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
 </svg>
 ),
 },
];

export default function ValidPassPage() {
 return (
 <main className="min-h-screen bg-background px-4 py-10 text-foreground">
 <div className="mx-auto flex w-full max-w-md flex-col gap-8">
 <header className="flex items-start gap-3">
 <Link
 href="/security"
 aria-label="Back to verify visitor"
 className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <span
 aria-hidden="true"
 className="h-3 w-3 rotate-45 border-b-2 border-l-2 border-border"
 />
 </Link>
 <div>
 <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
 Verify Visitor
 </h1>
 <p className="mt-2 text-sm text-muted-foreground">
 Verify access code
 </p>
 </div>
 </header>

 <section className="rounded-3xl bg-primary/10 p-4 pb-6 pt-14">
 <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-primary/60 bg-card text-primary">
 <svg viewBox="0 0 24 24" className="h-20 w-20" fill="none" stroke="currentColor" strokeWidth="1.8">
 <path d="m5 13 4 4L19 7" />
 </svg>
 </div>

 <div className="mt-8 text-center">
 <h2 className="text-3xl font-bold tracking-tight">Valid Pass</h2>
 <p className="mt-3 text-sm text-muted-foreground">
 Visitor is authorised
 </p>
 </div>

 <div className="mt-10 overflow-hidden rounded-2xl bg-card shadow-sm shadow-muted/50">
 {details.map((detail) => (
 <article
 key={detail.label}
 className="flex gap-5 border-b border-border px-6 py-5 last:border-b-0"
 >
 <span className="mt-3 shrink-0 text-foreground">
 {detail.icon}
 </span>
 <div>
 <p className="text-sm text-muted-foreground">
 {detail.label}
 </p>
 <p className="mt-2 text-lg font-bold leading-7">
 {detail.value}
 </p>
 </div>
 </article>
 ))}
 </div>
 </section>
 </div>
 </main>
 );
}
