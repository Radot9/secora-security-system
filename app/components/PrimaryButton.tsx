import type { ButtonHTMLAttributes } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
 children: React.ReactNode;
 className?: string;
}

export function PrimaryButton({
 children,
 className = "",
 ...props
}: PrimaryButtonProps) {
 return (
 <button
 type="button"
 className={`inline-flex w-full items-center justify-center rounded-2xl bg-primary/100 px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
 {...props}
 >
 {children}
 </button>
 );
}
