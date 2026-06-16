"use client";

import { useEffect, useState } from "react";
import { Check, Palette, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = {
  value: string;
  label: string;
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
    if (stored === "orange") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", stored);
    }
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
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4 z-[60] flex flex-col items-end gap-2 md:bottom-5">
      {open && (
        <div className="premium-panel w-[min(22rem,calc(100vw-2rem))] rounded-3xl p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Theme · {theme}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close theme picker"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((option) => {
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyTheme(option.value)}
                  className={cn(
                    "relative flex min-h-16 flex-col items-center gap-1.5 rounded-2xl border p-2 text-[10px] font-medium transition-colors",
                    isActive
                      ? "border-brand bg-brand/12 text-foreground"
                      : "border-border bg-input/25 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-white/15 shadow-inner"
                    style={{ backgroundColor: option.swatch }}
                  />
                  {isActive && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground">
            Accent only. Layout, spacing and components stay unchanged.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Theme picker"
        className="premium-glow flex h-12 w-12 items-center justify-center rounded-full border border-brand/35 bg-card text-brand shadow-xl transition-transform hover:scale-105"
      >
        <Palette className="h-5 w-5" />
      </button>
    </div>
  );
}
