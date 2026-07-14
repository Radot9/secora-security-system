"use client";

import { useState, type ChangeEventHandler, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
 id: string;
 label: string;
 value: string;
 onChange: ChangeEventHandler<HTMLInputElement>;
 className?: string;
}

export function InputField({
 id,
 label,
 type = "text",
 value,
 onChange,
 placeholder,
 autoComplete,
 className = "",
 ...props
}: InputFieldProps) {
 const [passwordVisible, setPasswordVisible] = useState(false);
 const isPassword = type === "password";

 return (
 <div className={`space-y-2 ${className}`}>
 <label htmlFor={id} className="block text-sm font-medium text-foreground">
 {label}
 </label>
 <div className="relative">
 <input
 id={id}
 type={isPassword && passwordVisible ? "text" : type}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 autoComplete={autoComplete}
 className={`w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 ${isPassword ? "pr-12" : ""}`}
 {...props}
 />
 {isPassword && (
 <button
 type="button"
 onClick={() => setPasswordVisible((visible) => !visible)}
 className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
 aria-label={passwordVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
 aria-pressed={passwordVisible}
 >
 {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
 </button>
 )}
 </div>
 </div>
 );
}
