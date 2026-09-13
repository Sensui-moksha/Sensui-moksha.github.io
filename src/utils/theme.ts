export interface ThemeOption {
  id: string;
  name: string;
  hex: string;
  rgb: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "purple",
    name: "Cyber Purple",
    hex: "#c2a4ff",
    rgb: "194, 164, 255",
  },
  {
    id: "cyan",
    name: "Neon Cyan",
    hex: "#38bdf8",
    rgb: "56, 189, 248",
  },
  {
    id: "emerald",
    name: "Matrix Emerald",
    hex: "#4ade80",
    rgb: "74, 222, 128",
  },
  {
    id: "amber",
    name: "Solar Amber",
    hex: "#fbbf24",
    rgb: "251, 191, 36",
  },
  {
    id: "rose",
    name: "Neon Rose",
    hex: "#fb7185",
    rgb: "251, 113, 133",
  },
];

const THEME_STORAGE_KEY = "portfolio_accent_theme";

export const getCurrentTheme = (): ThemeOption => {
  if (typeof window === "undefined") return THEMES[0];
  const savedId = localStorage.getItem(THEME_STORAGE_KEY);
  const found = THEMES.find((t) => t.id === savedId);
  return found || THEMES[0];
};

export const applyTheme = (themeId: string): boolean => {
  if (typeof document === "undefined") return false;
  const theme = THEMES.find(
    (t) => t.id.toLowerCase() === themeId.toLowerCase().trim()
  );
  if (!theme) return false;

  const root = document.documentElement;
  root.style.setProperty("--accentColor", theme.hex);
  root.style.setProperty("--accentRgba", theme.rgb);
  localStorage.setItem(THEME_STORAGE_KEY, theme.id);

  // Dispatch custom event so reactive components can update if needed
  window.dispatchEvent(
    new CustomEvent("accent-theme-change", { detail: theme })
  );

  return true;
};

export const initTheme = (): void => {
  if (typeof window === "undefined") return;
  const current = getCurrentTheme();
  applyTheme(current.id);
};
