"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  LayoutDashboard,
  MessageSquareText,
  User,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
  { href: "/profile", labelKey: "topbar.profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useAppPreferences();
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    function recompute() {
      const container = containerRef.current;
      if (!container) return;
      const activeItem = NAV_ITEMS.find(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
      if (!activeItem) {
        setIndicator(null);
        return;
      }
      const activeEl = linkRefs.current[activeItem.href];
      if (!activeEl) return;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [pathname]);

  if (pathname === "/workouts/new") return null;

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <div
        ref={containerRef}
        className="pointer-events-auto relative mx-auto flex h-[58px] w-full items-center justify-around border-t border-border bg-background/92 px-1.5 backdrop-blur-2xl"
        style={{
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
        }}
      >
        {indicator && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 h-0.5 rounded-full transition-[left,width] duration-300 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              background: "var(--brand)",
              boxShadow: "0 0 18px -4px var(--brand)",
            }}
          />
        )}
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <AppNavLink
              key={href}
              ref={(el) => {
                linkRefs.current[href] = el;
              }}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-medium leading-none transition-colors duration-300 ease-out active:scale-[0.96]",
                index === 1 && "mr-8",
                index === 2 && "ml-8",
                active
                  ? "text-brand"
                  : "text-muted-foreground/55 hover:text-foreground/80"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-transform duration-300 ease-out",
                  active && "scale-[1.08]"
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className="truncate">{t(labelKey)}</span>
            </AppNavLink>
          );
        })}
      </div>
    </nav>
  );
}
