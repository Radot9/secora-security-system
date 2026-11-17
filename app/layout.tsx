import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const geistHeading = localFont({
  src: [
    {
      path: "./fonts/Geist-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/Geist-Italic-VariableFont_wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

const outfit = localFont({
  src: "./fonts/Outfit-VariableFont_wght.ttf",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

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
