"use client";

import { SunMoon } from "lucide-react";

export function ThemeToggle() {
 function toggleTheme() {
 const nextDark = !document.documentElement.classList.contains("dark");
 document.documentElement.classList.toggle("dark", nextDark);
 document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
 localStorage.setItem("entriseq-theme-v1", nextDark ? "dark" : "light");
 }

 return (
 <button
 type="button"
 onClick={toggleTheme}
 aria-label="Toggle light and dark mode"
 title="Toggle light and dark mode"
 className="apple-icon-button flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground"
 >
 <SunMoon className="h-5 w-5 text-primary" />
 </button>
 );
}
