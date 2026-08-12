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
 className={`apple-primary-button inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground ${className}`}
 {...props}
 >
 {children}
 </button>
 );
}
