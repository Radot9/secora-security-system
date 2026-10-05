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
 default: "max-w-7xl",
 wide: "max-w-7xl",
 full: "max-w-7xl",
 };

 return (
 <main className={`${residentSidebar ? "resident-shell" : "app-page-shell"} ${className}`}>
 <div className={`mx-auto w-full ${widths[size]} ${contentClassName}`}>
 {children}
 </div>
 </main>
 );
}
