import type { Metadata } from "next";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import "./globals.css";

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
 <html lang="en">
 <body className="font-sans antialiased">
 {children}
 <FeedbackProvider />
 </body>
 </html>
 );
}
