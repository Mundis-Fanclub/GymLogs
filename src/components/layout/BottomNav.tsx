"use client";

import { usePathname } from "next/navigation";
import {
  BarChart2,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  User,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/workouts/new", labelKey: "common.newWorkout", icon: Plus, primary: true },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
  { href: "/profile", labelKey: "topbar.profile", icon: User },
];

const LEFT_NAV_ITEMS = NAV_ITEMS.slice(0, 2);
const RIGHT_NAV_ITEMS = NAV_ITEMS.slice(3);

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useAppPreferences();
  const primaryItem = NAV_ITEMS.find((item) => item.primary);

  if (!primaryItem) {
    return null;
  }

  const PrimaryIcon = primaryItem.icon;

  function renderSideItem({ href, labelKey, icon: Icon }: (typeof NAV_ITEMS)[number]) {
    const active = pathname === href || pathname.startsWith(href + "/");

    return (
      <AppNavLink
        key={href}
        href={href}
        active={active}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 pt-1.5 text-[10px] font-medium leading-none transition-[color,transform] duration-200 ease-out active:scale-[0.96]",
          active ? "text-primary" : "text-muted-foreground/62 hover:text-foreground/85"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-transform duration-200 ease-out",
            active && "scale-[1.08]"
          )}
          strokeWidth={active ? 2.2 : 1.8}
        />
        <span className="max-w-full truncate">{t(labelKey)}</span>
        {active && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 h-0.5 w-9 rounded-full bg-primary"
            style={{ boxShadow: "0 0 16px var(--brand-glow)" }}
          />
        )}
      </AppNavLink>
    );
  }

  const primaryActive = pathname === primaryItem.href || pathname.startsWith(primaryItem.href + "/");

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
      <div
        className="pointer-events-auto relative mx-auto h-[4.15rem] w-full max-w-[24.5rem] rounded-[1.25rem] border border-white/[0.07] bg-[#0a1012]/88 px-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
        style={{
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
        }}
      >
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_4.75rem_minmax(0,1fr)] items-center">
          <div className="flex h-full min-w-0">{LEFT_NAV_ITEMS.map(renderSideItem)}</div>
          <div aria-hidden="true" />
          <div className="flex h-full min-w-0">{RIGHT_NAV_ITEMS.map(renderSideItem)}</div>
        </div>
        <AppNavLink
          href={primaryItem.href}
          active={primaryActive}
          aria-current={primaryActive ? "page" : undefined}
          aria-label={t(primaryItem.labelKey)}
          className="absolute left-1/2 top-1/2 z-20 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-[#05090a] text-primary transition-[transform,color] duration-200 ease-out active:scale-[0.96]"
          style={{
            borderColor: "var(--primary)",
            boxShadow: "0 0 22px var(--brand-glow), inset 0 0 0 1px color-mix(in oklch, var(--primary) 22%, transparent)",
          }}
        >
          <PrimaryIcon className={cn("h-6 w-6 transition-transform duration-200", primaryActive && "scale-[1.04]")} strokeWidth={2} />
        </AppNavLink>
      </div>
    </nav>
  );
}
