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
 onKeyDown={onClick ? (event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 onClick();
 }
 } : undefined}
 role={onClick ? "button" : undefined}
 tabIndex={onClick ? 0 : undefined}
 data-interactive={onClick ? "true" : undefined}
 className={`apple-card rounded-3xl border border-border bg-card p-6 ${className}`}
 >
 {children}
 </div>
 );
}
