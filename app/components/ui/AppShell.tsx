import { ReactNode } from "react";

interface AppShellProps {
 children: ReactNode;
 size?: "compact" | "default" | "wide" | "full";
 className?: string;
 contentClassName?: string;
 residentSidebar?: boolean;
}

export function AppShell({
 children,
 size = "default",
 className = "",
 contentClassName = "",
 residentSidebar = false,
}: AppShellProps) {
 const widths = {
 compact: "max-w-3xl",
 default: "max-w-6xl",
 wide: "max-w-7xl",
 full: "max-w-none",
 };

 return (
 <main className={`${residentSidebar ? "resident-shell" : "min-h-screen bg-background px-4 py-10 text-foreground"} ${className}`}>
 <div className={`mx-auto w-full ${widths[size]} ${contentClassName}`}>
 {children}
 </div>
 </main>
 );
}
