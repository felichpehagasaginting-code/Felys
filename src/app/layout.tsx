import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1A22" },
  ],
};

export const metadata: Metadata = {
  title: "Felys — Atur Waktu, Atur Uang, Tenang Aja",
  description:
    "Aplikasi produktivitas terpadu dual-mode (Akademik & Finansial) dengan asisten AI kontekstual untuk mahasiswa.",
  applicationName: "Felys",
  appleWebApp: {
    capable: true,
    title: "Felys",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-mode="academic" className={jakarta.variable} suppressHydrationWarning>
      <body className={`${jakarta.className} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
