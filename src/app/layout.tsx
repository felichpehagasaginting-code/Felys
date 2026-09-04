import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AntiZoomProvider } from "@/components/shared/AntiZoomProvider";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { ThemeModeProvider } from "@/components/shared/ThemeModeProvider";
import { SmoothScrollProvider } from "@/components/shared/SmoothScrollProvider";

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
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#181716" },
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
    statusBarStyle: "black-translucent",
    startupImage: [
      "/apple-touch-icon.png",
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/felys-logo.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/felys-logo.svg"],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-mode="academic" className={jakarta.variable} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Inline Theme Initializer: Runs synchronously before initial render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('felys_theme_preference');
                var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }

                var mode = localStorage.getItem('felys_active_mode');
                if (mode === 'academic' || mode === 'finance') {
                  document.documentElement.setAttribute('data-mode', mode);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${jakarta.className} font-sans antialiased min-h-screen min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300 select-none`}>
        <ThemeModeProvider>
          <AntiZoomProvider />
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
          <PWAInstallPrompt />
          <Toaster position="top-right" richColors closeButton />
        </ThemeModeProvider>
      </body>
    </html>
  );
}
