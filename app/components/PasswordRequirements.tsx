import { Check, Circle } from "lucide-react";
import { passwordRequirements } from "@/lib/password-requirements";

export function PasswordRequirements({ password }: { password: string }) {
 return (
 <div className="space-y-2" aria-live="polite">
 <p className="text-sm font-medium text-foreground">Password requirements</p>
 <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
 {passwordRequirements.map((requirement) => {
 const met = requirement.test(password);

 return (
 <li key={requirement.label} className={met ? "flex items-center gap-2 text-emerald-600" : "flex items-center gap-2 text-muted-foreground"}>
 {met ? <Check className="h-4 w-4" aria-hidden="true" /> : <Circle className="h-3.5 w-3.5" aria-hidden="true" />}
 <span>{requirement.label}</span>
 </li>
 );
 })}
 </ul>
 <p className="text-xs leading-5 text-muted-foreground">Include an uppercase letter and a special character, such as !, @, or #. Numbers are optional.</p>
 </div>
 );
}
