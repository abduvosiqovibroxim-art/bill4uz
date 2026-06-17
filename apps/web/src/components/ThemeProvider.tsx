"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "billuz-theme";
const THEME_EXPLICIT_STORAGE_KEY = "billuz-theme-explicit";
const DEFAULT_THEME: Theme = "light";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const hasExplicitPreference = window.localStorage.getItem(THEME_EXPLICIT_STORAGE_KEY) === "1";
    const initialTheme: Theme =
      hasExplicitPreference && (storedTheme === "dark" || storedTheme === "light") ? storedTheme : DEFAULT_THEME;

    setThemeState(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    document.body.setAttribute("data-theme", initialTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isInitialized, theme]);

  const value = useMemo<ThemeContextValue>(() => {
    const setTheme = (nextTheme: Theme) => {
      setThemeState(nextTheme);
      window.localStorage.setItem(THEME_EXPLICIT_STORAGE_KEY, "1");
    };

    const toggleTheme = () => {
      setTheme(theme === "dark" ? "light" : "dark");
    };

    return {
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
