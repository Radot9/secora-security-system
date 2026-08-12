import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Outfit, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const themeScript = `
(function () {
  var storedTheme = localStorage.getItem("entriseq-theme-v1");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var isDark = storedTheme === "dark" || (storedTheme !== "light" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
})();
`;

export const metadata: Metadata = {
 title: "Entriseq Estate Security",
 description: "Visitor access, safety, announcements, and community for your estate.",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html
 lang="en"
 className={cn("h-full antialiased font-sans", outfit.variable, geistHeading.variable)}
 data-scroll-behavior="smooth"
 suppressHydrationWarning
 >
 <head>
 <meta name="color-scheme" content="light dark" />
 <script dangerouslySetInnerHTML={{ __html: themeScript }} />
 </head>
 <body className="flex min-h-full flex-col">
 <Toaster position="bottom-right" richColors closeButton />
 {children}
 </body>
 </html>
 );
}
