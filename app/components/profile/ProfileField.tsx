import { ReactNode } from "react";

interface ProfileFieldProps {
 label: string;
 value: ReactNode;
}

export default function ProfileField({
 label,
 value,
}: ProfileFieldProps) {
 return (
 <div className="flex items-start justify-between border-b border-border py-4 last:border-b-0">

 <p className="text-sm font-medium text-muted-foreground">
 {label}
 </p>

 <p className="text-right font-semibold text-foreground">
 {value}
 </p>

 </div>
 );
}