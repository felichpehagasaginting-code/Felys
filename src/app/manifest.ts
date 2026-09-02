import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Felys — Student Assistant",
    short_name: "Felys",
    description: "Aplikasi Terpadu Manajemen Beban Akademik & Keuangan Mahasiswa",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#7C5CFA",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
