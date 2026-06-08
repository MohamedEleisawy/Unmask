import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unmask — Audit de crédibilité",
  description: "Vérifiez l'identité légale et la conformité AMF/ACPR d'une entité.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
