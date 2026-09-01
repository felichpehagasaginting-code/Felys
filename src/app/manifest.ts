import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Felys — Student Assistant",
    short_name: "Felys",
    description: "Aplikasi Terpadu Manajemen Beban Akademik & Keuangan Mahasiswa",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9FC",
    theme_color: "#7C5CFA",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
