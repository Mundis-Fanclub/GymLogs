"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  LayoutDashboard,
  MessageSquareText,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
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

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
      <div
        ref={containerRef}
        className="pointer-events-auto relative mx-auto flex h-14 w-full max-w-[23.5rem] items-center justify-around rounded-2xl px-1.5"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 55%, rgba(0, 0, 0, 0.03) 100%), rgba(10, 10, 12, 0.22)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow:
            "0 24px 60px -16px rgba(0, 0, 0, 0.55), 0 6px 20px -10px rgba(0, 0, 0, 0.28), inset 0 1px 0 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 0 rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
        }}
      >
        {indicator && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 rounded-xl transition-[left,width] duration-300 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              background:
                "linear-gradient(180deg, rgba(249, 138, 42, 0.13) 0%, rgba(249, 138, 42, 0.04) 100%)",
              border: "1px solid rgba(249, 138, 42, 0.15)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 0 24px -8px rgba(249, 115, 22, 0.6)",
            }}
          />
        )}
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
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
                "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[10.5px] font-medium leading-none transition-colors duration-300 ease-out active:scale-[0.96]",
                active
                  ? "text-brand"
                  : "text-muted-foreground/55 hover:text-foreground/80"
              )}
            >
              <Icon
                className={cn(
                  "h-[20px] w-[20px] shrink-0 transition-transform duration-300 ease-out",
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
