import { ReactNode } from "react";



interface SettingsSectionProps {
 title: string;
 children: ReactNode;
}

export default function SettingsSection({
 title,
 children,
}: SettingsSectionProps) {
 return (
 <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">

 <h2 className="mb-6 text-lg font-bold">
 {title}
 </h2>

 <div className="space-y-6">
 {children}
 </div>

 </section>
 );
}