import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Projeto Verão",
    short_name: "Pj. Verão",
    description:
      "App pessoal de treino: perfis, treinos, corridas e estatísticas de evolução.",
    start_url: "/",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#050506",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
