import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

export const ACCENT_SWATCHES = [
  { name: "SANITY Pink", hex: "#F9A8D4" },
  { name: "Lavender", hex: "#E9D5FF" },
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Emerald", hex: "#34d399" },
  { name: "Amber", hex: "#fbbf24" },
  { name: "Coral", hex: "#fb7185" },
  { name: "Pure White", hex: "#ffffff" },
];

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const ThemeCtx = createContext<Ctx>({
  theme: "dark",
  setTheme: () => {},
  accentColor: "#F9A8D4",
  setAccentColor: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sanity_theme") as Theme) || "dark";
    }
    return "dark";
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sanity_accent") || "#F9A8D4";
    }
    return "#F9A8D4";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") {
      localStorage.setItem("sanity_theme", t);
    }
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    if (typeof window !== "undefined") {
      localStorage.setItem("sanity_accent", color);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);

    // Update dynamic accent variables on root
    root.style.setProperty("--accent", accentColor);
    root.style.setProperty("--ring", accentColor);
    root.style.setProperty(
      "--gradient-accent",
      `linear-gradient(135deg, ${accentColor} 0%, #E9D5FF 100%)`
    );
  }, [theme, accentColor]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

