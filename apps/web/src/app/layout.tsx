import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import "./globals.css";

const inter = Inter({
 subsets: ["latin"],
 variable: "--font-inter",
 display: "swap"
});

const spaceGrotesk = Space_Grotesk({
 subsets: ["latin"],
 variable: "--font-space-grotesk",
 display: "swap"
});

export const metadata: Metadata = {
 title: "Senior IDP Platform",
 description: "Phase 1 Internal Developer Platform portal"
};

export default function RootLayout({
 children
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
 <body className="font-sans antialiased">
 {children}
 <FeedbackProvider />
 </body>
 </html>
 );
}
