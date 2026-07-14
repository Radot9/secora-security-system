import { ReactNode } from "react";

interface CardProps {
 children: ReactNode;
 className?: string;
 onClick?: () => void;
}

export function Card({
 children,
 className = "",
 onClick,
}: CardProps) {
 return (
 <div
 onClick={onClick}
 className={`rounded-3xl border border-border bg-card p-6 shadow-sm shadow-muted/50 ${className}`}
 >
 {children}
 </div>
 );
}