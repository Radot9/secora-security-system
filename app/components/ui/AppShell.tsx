import { ReactNode } from "react";

interface AppShellProps {
 children: ReactNode;
 size?: "compact" | "default" | "wide";
}

export function AppShell({
 children,
 size = "default",
}: AppShellProps) {
 const widths = {
 compact: "max-w-3xl",
 default: "max-w-6xl",
 wide: "max-w-7xl",
 };

 return (
 <main className="min-h-screen bg-background px-4 py-10 text-foreground">
 <div className={`mx-auto w-full ${widths[size]}`}>
 {children}
 </div>
 </main>
 );
}