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
};

export const THEMES = Object.keys(THEME_META) as Theme[];
