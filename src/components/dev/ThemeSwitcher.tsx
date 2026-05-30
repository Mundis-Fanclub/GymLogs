"use client";

import { useEffect, useState } from "react";
import { Palette, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dev-only floating theme picker. Sets data-theme on <html> and persists
 * the choice in localStorage. The actual color tokens live in globals.css
 * under [data-theme="..."] selectors — this component only flips the
 * attribute.
 */

type ThemeOption = {
  value: string;
  label: string;
  /** Swatch color, dark-mode value of --brand (matches what the user sees). */
  swatch: string;
};

const THEMES: ThemeOption[] = [
  { value: "orange", label: "Orange", swatch: "oklch(0.76 0.2 55)" },
  { value: "coral", label: "Coral", swatch: "oklch(0.74 0.2 35)" },
  { value: "crimson", label: "Crimson", swatch: "oklch(0.7 0.22 22)" },
  { value: "amber", label: "Amber", swatch: "oklch(0.82 0.18 80)" },
  { value: "lime", label: "Lime", swatch: "oklch(0.9 0.3 128)" },
  { value: "mint", label: "Mint", swatch: "oklch(0.86 0.14 155)" },
  { value: "emerald", label: "Emerald", swatch: "oklch(0.74 0.18 160)" },
  { value: "teal", label: "Teal", swatch: "oklch(0.74 0.14 180)" },
  { value: "cyan", label: "Cyan", swatch: "oklch(0.78 0.14 200)" },
  { value: "sky", label: "Sky", swatch: "oklch(0.78 0.16 230)" },
  { value: "royal", label: "Royal", swatch: "oklch(0.7 0.22 250)" },
  { value: "indigo", label: "Indigo", swatch: "oklch(0.68 0.2 270)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.7 0.22 295)" },
  { value: "magenta", label: "Magenta", swatch: "oklch(0.7 0.25 340)" },
  { value: "mono", label: "Mono", swatch: "oklch(0.85 0 0)" },
];

const STORAGE_KEY = "gymlogs-theme";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("orange");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || "orange";
    setTheme(stored);
  }, []);

  function applyTheme(value: string) {
    if (value === "orange") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", value);
    }
    localStorage.setItem(STORAGE_KEY, value);
    setTheme(value);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {open && (
        <div className="w-[280px] rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Theme · {theme}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Schließen"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {THEMES.map((t) => {
              const isActive = theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => applyTheme(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-[10px] font-medium transition-colors",
                    isActive
                      ? "border-foreground bg-accent"
                      : "border-border bg-background/40 hover:bg-accent/60"
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-white/10 shadow-inner"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground">
            Wahl bleibt in localStorage gespeichert. Nur im dev-Build sichtbar.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme switcher"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xl transition-transform hover:scale-105"
      >
        <Palette className="h-5 w-5" />
      </button>
    </div>
  );
}
