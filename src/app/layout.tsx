import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Felys — Atur Waktu, Atur Uang, Tenang Aja",
  description:
    "Aplikasi produktivitas terpadu dual-mode (Akademik & Finansial) dengan asisten AI kontekstual untuk mahasiswa.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-mode="academic" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
