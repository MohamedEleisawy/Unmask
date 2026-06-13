import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegister } from "@/features/pwa/ServiceWorkerRegister";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unmask — Audit de crédibilité",
  description: "Analyse de crédibilité des influenceurs, entrepreneurs et sites web.",
  applicationName: "Unmask",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Unmask",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  // Couleur de la barre du navigateur : sombre, cohérente avec le fond de l'app.
  // (Le manifest porte le theme_color de marque #0cdda5 pour le lanceur PWA.)
  themeColor: "#0b0b0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC : applique le thème mémorisé avant le premier rendu.
            Sans préférence stockée → pas de data-theme → suit le système (auto). */}
        <Script id="theme-init" strategy="beforeInteractive">
          {"try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}"}
        </Script>
      </head>
      <body className="min-h-dvh flex flex-col" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
