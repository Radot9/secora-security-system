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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <h2 className="mb-6 text-lg font-bold">
        {title}
      </h2>

      <div className="space-y-6">
        {children}
      </div>

    </section>
  );
}