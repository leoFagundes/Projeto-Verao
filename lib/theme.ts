import type { Theme } from "@/types/profile";

type ThemeMeta = {
  label: string;
  accent: string;
  accentSoft: string;
  gradient: string;
  swatch: string;
};

export const THEME_META: Record<Theme, ThemeMeta> = {
  padrao: {
    label: "Padrão",
    accent: "#818cf8",
    accentSoft: "rgba(129, 140, 248, 0.16)",
    gradient: "linear-gradient(135deg, #818cf8, #38bdf8)",
    swatch: "linear-gradient(135deg, #312e81, #818cf8, #38bdf8)",
  },
  verde: {
    label: "Verde",
    accent: "#34d399",
    accentSoft: "rgba(52, 211, 153, 0.16)",
    gradient: "linear-gradient(135deg, #34d399, #a3e635)",
    swatch: "linear-gradient(135deg, #020617, #059669, #34d399)",
  },
  rosa: {
    label: "Rosa",
    accent: "#f472b6",
    accentSoft: "rgba(244, 114, 182, 0.16)",
    gradient: "linear-gradient(135deg, #f472b6, #fb7185)",
    swatch: "linear-gradient(135deg, #020617, #be185d, #f472b6)",
  },
  roxo: {
    label: "Roxo",
    accent: "#a78bfa",
    accentSoft: "rgba(167, 139, 250, 0.16)",
    gradient: "linear-gradient(135deg, #a78bfa, #e879f9)",
    swatch: "linear-gradient(135deg, #1e1b4b, #7c3aed, #e879f9)",
  },
  laranja: {
    label: "Laranja",
    accent: "#fb923c",
    accentSoft: "rgba(251, 146, 60, 0.16)",
    gradient: "linear-gradient(135deg, #fb923c, #fbbf24)",
    swatch: "linear-gradient(135deg, #431407, #ea580c, #fbbf24)",
  },
  ciano: {
    label: "Ciano",
    accent: "#22d3ee",
    accentSoft: "rgba(34, 211, 238, 0.16)",
    gradient: "linear-gradient(135deg, #22d3ee, #2dd4bf)",
    swatch: "linear-gradient(135deg, #042f2e, #0891b2, #2dd4bf)",
  },
};

export const THEMES = Object.keys(THEME_META) as Theme[];
