import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Biarkan linting di lokal/GitHub Actions agar build Vercel langsung to-the-point
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip re-checking types di Vercel build container (hemat ~1-2 menit & cegah OOM)
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["tesseract.js", "pdfjs-dist"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
