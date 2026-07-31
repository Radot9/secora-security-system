import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Outfit, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const systemThemeScript = `
(function () {
  function applyTheme(event) {
    var prefersDark = event ? event.matches : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
    document.documentElement.style.colorScheme = prefersDark ? "dark" : "light";
  }

  var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  applyTheme(mediaQuery);
  mediaQuery.addEventListener("change", applyTheme);
})();
`;

export const metadata: Metadata = {
 title: "Secora Security System",
 description: "Security system for Secora Powered Estate",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html
 lang="en"
 className={cn("h-full antialiased font-sans", "font-sans", outfit.variable, geistHeading.variable)}
 data-scroll-behavior="smooth"
 suppressHydrationWarning
 >
 <head>
 <meta name="color-scheme" content="light dark" />
 <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />
 </head>
 <body className="flex min-h-full flex-col">
 <Toaster position="bottom-right" richColors closeButton />
 {children}
 </body>
 </html>
 );
}
