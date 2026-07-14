import { ReactNode } from "react";

interface ProfileCardProps {
 title: string;
 children: ReactNode;
}

export default function ProfileCard({ title, children }: ProfileCardProps) {
 return (
 <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
 <h2 className="mb-6 text-lg font-bold">{title}</h2>

 <div className="divide-y divide-border">
 {children}
 </div>
 </section>
 );
}
