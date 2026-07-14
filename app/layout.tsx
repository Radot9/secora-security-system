import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
 variable: "--font-inter",
 subsets: ["latin"],
});

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

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
 className={cn("h-full antialiased font-sans", inter.variable, geistMono.variable)}
 >
 
 <body className="flex min-h-full flex-col">
 <Toaster position="bottom-right" richColors closeButton />
 {children}
 </body>
 </html>
 );
}
