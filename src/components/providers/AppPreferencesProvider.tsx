"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getNestedTranslation,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALES,
  type Locale,
} from "@/lib/i18n";

type Theme = "dark" | "light";

type AppPreferencesContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
};

const AppPreferencesContext =
  createContext<AppPreferencesContextValue | null>(null);

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

function detectTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("gymlogs-locale");
    const nextLocale = LOCALES.includes(storedLocale as Locale)
      ? (storedLocale as Locale)
      : detectLocale();
    setLocaleState(nextLocale);

    const storedTheme = window.localStorage.getItem("gymlogs-theme");
    setTheme(storedTheme === "light" || storedTheme === "dark" ? storedTheme : detectTheme());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("gymlogs-locale", locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("gymlogs-theme", theme);
  }, [theme]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === "dark" ? "light" : "dark")),
      t: (key) => getNestedTranslation(locale, key),
    }),
    [locale, theme]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const value = useContext(AppPreferencesContext);
  if (!value) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  }
  return value;
}

export { LOCALE_FLAGS, LOCALE_LABELS, LOCALES };
