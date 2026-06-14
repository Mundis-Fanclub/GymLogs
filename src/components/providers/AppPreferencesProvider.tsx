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

type Theme = "dark";

const COLOR_MODE_STORAGE_KEY = "gymlogs-color-mode";
const PALETTE_STORAGE_KEY = "gymlogs-theme";

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

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("gymlogs-locale");
    const nextLocale = LOCALES.includes(storedLocale as Locale)
      ? (storedLocale as Locale)
      : detectLocale();
    setLocaleState(nextLocale);

    setTheme("dark");
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");

    const storedPalette = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (storedPalette && storedPalette !== "orange" && storedPalette !== "light" && storedPalette !== "dark") {
      document.documentElement.setAttribute("data-theme", storedPalette);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("gymlogs-locale", locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
  }, [theme]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      theme,
      toggleTheme: () => setTheme("dark"),
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
